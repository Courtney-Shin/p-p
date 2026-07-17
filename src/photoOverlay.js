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
  // Bright diagonal highlight band, like light catching a glossy print.
  // Pushed noticeably stronger than a "subtle" print sheen would realistically
  // be — at normal viewing size a truly subtle sheen reads as nothing.
  const grad = ctx.createLinearGradient(x, y, x + w * 0.7, y + h * 0.7)
  grad.addColorStop(0, `rgba(255,255,255,${0.55 * intensity})`)
  grad.addColorStop(0.22, `rgba(255,255,255,${0.25 * intensity})`)
  grad.addColorStop(0.4, 'rgba(255,255,255,0)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(x, y, w, h)

  // second, tighter highlight streak for a more obviously "plastic/glossy"
  // double-sheen look rather than one faint gradient
  const streak = ctx.createLinearGradient(x + w * 0.1, y, x + w * 0.55, y + h * 0.45)
  streak.addColorStop(0, `rgba(255,255,255,${0.35 * intensity})`)
  streak.addColorStop(0.5, 'rgba(255,255,255,0)')
  ctx.fillStyle = streak
  ctx.fillRect(x, y, w, h)

  // stronger bottom-edge shadow for a glossy-print curl feel
  const shadow = ctx.createLinearGradient(x, y + h * 0.78, x, y + h)
  shadow.addColorStop(0, 'rgba(0,0,0,0)')
  shadow.addColorStop(1, `rgba(0,0,0,${0.28 * intensity})`)
  ctx.fillStyle = shadow
  ctx.fillRect(x, y + h * 0.78, w, h * 0.22)
}

function drawPhotoGrain(ctx, x, y, w, h, intensity) {
  // Fine monochrome speckle over the whole photo, like film grain. Pushed
  // considerably denser/higher-contrast than a "realistic" grain would be
  // — at normal viewing/export size, subtle grain is imperceptible, so
  // this needs to visibly read as a texture rather than just technically
  // modify a few pixels.
  const density = 3.2 * intensity
  const count = Math.floor(w * h * density * 0.012)
  ctx.save()
  for (let i = 0; i < count; i++) {
    const px = x + Math.random() * w
    const py = y + Math.random() * h
    const light = Math.random() > 0.5
    const r = 1 + Math.random() * 1.6
    ctx.fillStyle = light ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'
    ctx.globalAlpha = 0.45 + Math.random() * 0.4
    ctx.beginPath()
    ctx.arc(px, py, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}
