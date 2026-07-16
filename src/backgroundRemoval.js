// Background removal via MediaPipe ImageSegmenter (Apache 2.0, free for
// commercial use). Model + WASM assets are self-hosted under /public so
// this never makes a network call at runtime — consistent with the rest of
// the app's "everything stays in your browser" guarantee.
//
// This module is the single seam between the app and whatever segmentation
// backend is in use. If this ever gets swapped for a different engine
// (e.g. a higher-quality matting model), only this file's internals should
// need to change — callers just get back a binary mask.

import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision'

const WASM_PATH = `${import.meta.env.BASE_URL}mediapipe/wasm`
const MODEL_PATH = `${import.meta.env.BASE_URL}mediapipe/models/selfie_segmenter.tflite`

let segmenterPromise = null

function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_PATH)
      return ImageSegmenter.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_PATH },
        // selfie_segmenter's underlying tensor is a single-channel
        // person-confidence map, not a true multi-class category tensor.
        // Asking for a category mask forces MediaPipe to synthesize a
        // category index from that single channel, which is an unreliable
        // path (see google-ai-edge/mediapipe#6142, #6296) and can silently
        // return a mask that's uniformly one value instead of erroring.
        // Reading the raw confidence float and thresholding it ourselves
        // is the documented-reliable approach for this specific model.
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      })
    })()
  }
  return segmenterPromise
}

// Confidence above this is treated as "subject." 0.5 is the standard
// midpoint for a person-vs-background probability.
const SUBJECT_CONFIDENCE_THRESHOLD = 0.5

// Preloads the segmenter (model download + WASM init) ahead of time so the
// first "remove background" click doesn't stall on a multi-second load.
export function preloadSegmenter() {
  getSegmenter().catch(() => {
    // swallow — a failed preload just means the real call will retry/report
  })
}

// Runs segmentation on an HTMLImageElement and returns a Uint8ClampedArray
// alpha mask (0 = background, 255 = subject) at the model's mask
// resolution, built by thresholding the raw person-confidence floats.
export async function getSubjectMask(imgEl) {
  const segmenter = await getSegmenter()
  const result = segmenter.segment(imgEl)
  const confidenceMask = result.confidenceMasks?.[0]
  if (!confidenceMask) {
    result.close?.()
    throw new Error('Segmentation produced no mask')
  }

  const width = confidenceMask.width
  const height = confidenceMask.height
  const raw = confidenceMask.getAsFloat32Array()
  const alpha = new Uint8ClampedArray(width * height)
  for (let i = 0; i < raw.length; i++) {
    alpha[i] = raw[i] >= SUBJECT_CONFIDENCE_THRESHOLD ? 255 : 0
  }

  confidenceMask.close?.()
  result.close?.()
  return { alpha, width, height }
}

// Applies a mask (from getSubjectMask, possibly at a different resolution
// than the source image) to produce a cutout: an offscreen canvas holding
// just the subject with a transparent background, sized to the source image.
export function applyMaskToImage(imgEl, mask) {
  const canvas = document.createElement('canvas')
  canvas.width = imgEl.naturalWidth || imgEl.width
  canvas.height = imgEl.naturalHeight || imgEl.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { alpha, width: maskW, height: maskH } = mask
  const scaleX = maskW / canvas.width
  const scaleY = maskH / canvas.height

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const mx = Math.min(maskW - 1, Math.floor(x * scaleX))
      const my = Math.min(maskH - 1, Math.floor(y * scaleY))
      const maskIdx = my * maskW + mx
      const pixelIdx = (y * canvas.width + x) * 4 + 3
      imageData.data[pixelIdx] = alpha[maskIdx]
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}
