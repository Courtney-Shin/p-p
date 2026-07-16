// Photo overlay effects: glossy sheen and grain/noise applied directly over
// the photo region itself (not the frame border). These are separate from
// frames.js's frame textures — a user can have a glossy PHOTO inside a dotted
// FRAME, or a grainy photo inside a solid frame, independently.

export const PHOTO_OVERLAYS = ['none', 'glossy', 'grain']

// Paints an overlay effect across the photo rect (x, y, w, h). Call this
// after the photo has been drawn and clipped, before the frame is painted.
export function drawPhotoOverlay(ctx, { x, y, w, h, style, intensity = 1 }) {
  if (style === 'none' || !style) return

  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()

  if (style === 'glossy') {
    drawGlossySheen(ctx, x, y, w, h, intensity)
  } else if (style === 'grain') {
    drawPhotoGrain(ctx, x, y, w, h, intensity)
  }

  ctx.restore()
}

function drawGlossySheen(ctx, x, y, w, h, intensity) {
  // soft diagonal highlight band, like light catching a glossy print
  const grad = ctx.createLinearGradient(x, y, x + w * 0.7, y + h * 0.7)
  grad.addColorStop(0, `rgba(255,255,255,${0.28 * intensity})`)
  grad.addColorStop(0.18, `rgba(255,255,255,${0.1 * intensity})`)
  grad.addColorStop(0.32, 'rgba(255,255,255,0)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(x, y, w, h)

  // subtle bottom-edge shadow for a glossy-print curl feel
  const shadow = ctx.createLinearGradient(x, y + h * 0.82, x, y + h)
  shadow.addColorStop(0, 'rgba(0,0,0,0)')
  shadow.addColorStop(1, `rgba(0,0,0,${0.12 * intensity})`)
  ctx.fillStyle = shadow
  ctx.fillRect(x, y + h * 0.82, w, h * 0.18)
}

function drawPhotoGrain(ctx, x, y, w, h, intensity) {
  // fine monochrome speckle over the whole photo, like film grain. Speckles
  // are 1.5-2.5px (not 1px) and denser/higher-contrast than a strict
  // realistic grain would be, since at normal viewing/export size a
  // literal 1px-at-15%-opacity speckle field is imperceptible — this needs
  // to actually read as a texture, not just be technically present.
  const density = 1.6 * intensity
  const count = Math.floor(w * h * density * 0.012)
  ctx.save()
  for (let i = 0; i < count; i++) {
    const px = x + Math.random() * w
    const py = y + Math.random() * h
    const light = Math.random() > 0.5
    const r = 0.8 + Math.random() * 1.2
    ctx.fillStyle = light ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)'
    ctx.globalAlpha = 0.3 + Math.random() * 0.35
    ctx.beginPath()
    ctx.arc(px, py, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}
