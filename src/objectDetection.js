// Real object detection via transformers.js running DETR (facebook/detr-
// resnet-50, Apache 2.0, free for commercial use) entirely in the browser —
// no server, no API key, no per-request cost. Same "self-hosted model,
// zero network calls after first load" pattern as backgroundRemoval.js,
// except this model is fetched from the Hugging Face CDN on first use
// (transformers.js caches it via the browser Cache API afterward) rather
// than being bundled in /public, since it's an opt-in feature — most users
// who never click "Analyze with AI" should never pay that download cost.
//
// This is the single seam between the app and whatever detection backend
// is in use — callers get back a plain list of {label, confidence, box}.

let detectorPromise = null

function getDetector(onProgress) {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const [{ pipeline, env }, ort] = await Promise.all([
        import('@huggingface/transformers'),
        import('onnxruntime-web'),
      ])
      // ORT session creation can hang indefinitely (not error) with
      // numThreads > 1 on models that use external data files — DETR's
      // quantized ONNX export is one — even with COOP/COEP cross-origin
      // isolation correctly enabled (microsoft/onnxruntime#26858). Setting
      // numThreads only on transformers.js's re-exported `env` isn't
      // reliably honored by the underlying onnxruntime-web singleton in
      // all versions, so set it on both, synchronously, before anything
      // else can touch ORT's env and initialize the thread pool first.
      env.backends.onnx.wasm.numThreads = 1
      env.backends.onnx.wasm.proxy = false
      ort.env.wasm.numThreads = 1
      return pipeline('object-detection', 'Xenova/detr-resnet-50', {
        dtype: 'q8',
        device: 'wasm',
        progress_callback: onProgress,
      })
    })()
  }
  return detectorPromise
}

// Preloads the model in the background (called when the user opts in) so
// the first real detection call doesn't stall on the full download.
export function preloadDetector(onProgress) {
  return getDetector(onProgress).catch((err) => {
    detectorPromise = null // allow retry on next call rather than caching a rejection
    throw err
  })
}

// transformers.js's RawImage.read() only accepts a URL string, Blob, or
// (Offscreen)Canvas — not a raw HTMLImageElement — so a loaded <img> has to
// be drawn to a canvas first rather than passed directly to the pipeline.
function toCanvas(imgEl) {
  if (imgEl instanceof HTMLCanvasElement || imgEl instanceof OffscreenCanvas) return imgEl
  const canvas = document.createElement('canvas')
  canvas.width = imgEl.naturalWidth || imgEl.width
  canvas.height = imgEl.naturalHeight || imgEl.height
  canvas.getContext('2d').drawImage(imgEl, 0, 0)
  return canvas
}

// Runs detection on an HTMLImageElement/canvas, returns a list of
// { label, confidence, box: {x, y, w, h} } with box in 0-1 fractions of
// the image (not pixels), so callers don't need to know source resolution.
export async function detectObjects(imgEl, { threshold = 0.4, onProgress } = {}) {
  const detector = await getDetector(onProgress)
  const input = toCanvas(imgEl)
  const results = await detector(input, { threshold, percentage: true })
  return results.map((r) => ({
    label: r.label,
    confidence: r.score,
    box: {
      x: r.box.xmin,
      y: r.box.ymin,
      w: r.box.xmax - r.box.xmin,
      h: r.box.ymax - r.box.ymin,
    },
  }))
}
