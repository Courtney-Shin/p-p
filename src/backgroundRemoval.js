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
        outputCategoryMask: true,
        outputConfidenceMasks: false,
      })
    })()
  }
  return segmenterPromise
}

// Preloads the segmenter (model download + WASM init) ahead of time so the
// first "remove background" click doesn't stall on a multi-second load.
export function preloadSegmenter() {
  getSegmenter().catch(() => {
    // swallow — a failed preload just means the real call will retry/report
  })
}

// Runs segmentation on an HTMLImageElement and returns a Uint8ClampedArray
// alpha mask (0 = background, 255 = subject) at the image's natural
// resolution. Category 0 in the selfie segmenter model is background.
export async function getSubjectMask(imgEl) {
  const segmenter = await getSegmenter()
  const result = segmenter.segment(imgEl)
  const categoryMask = result.categoryMask
  if (!categoryMask) {
    result.close?.()
    throw new Error('Segmentation produced no mask')
  }

  const width = categoryMask.width
  const height = categoryMask.height
  const raw = categoryMask.getAsUint8Array()
  const alpha = new Uint8ClampedArray(width * height)
  for (let i = 0; i < raw.length; i++) {
    // background category is 0; everything else counts as subject
    alpha[i] = raw[i] === 0 ? 0 : 255
  }

  categoryMask.close?.()
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
