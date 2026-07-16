// Frame rendering: draws a decorative border around a photo region on a
// canvas using a frameColors role set ({ base, border, smallAccent }) from
// palette.js, in one of several textures matched to the photo's visual
// quality rather than its subject matter (no literal wood-frame-for-forest
// novelty theming).

export const FRAME_STYLES = ['solid', 'dots', 'stripes', 'grain', 'glossy', 'faded', 'polaroid']

// Recommends a texture from photo-quality signals (brightness, variance as
// a blur/detail proxy, saturation) — a starting suggestion, not a lock.
export function suggestTexture({ avgL, variance, avgS }) {
  if (variance < 0.006) return 'faded' // blurry/low-detail -> rough/faded print
  if (avgL < 0.32 && avgS > 0.35) return 'glossy' // dark + saturated -> nightlife/flash
  if (avgL > 0.6 && avgS < 0.25) return 'grain' // bright, low-saturation -> soft paper grain
  return 'solid'
}

// Paints a frame of `thickness` px around the rect (x, y, w, h) — i.e. the
// border occupies the area between the outer rect and the inner photo rect.
// frameColors: { base, border, smallAccent } hex strings from palette.js.
// `top`/`bottom` (polaroid only) override thickness on those two edges so
// the card can have the classic thin-top/thick-bottom instant-photo shape.
export function drawFrame(ctx, { x, y, w, h, thickness, top, bottom, style, frameColors }) {
  if (style === 'polaroid') {
    drawPolaroidCard(ctx, { x, y, w, h, side: thickness, top: top ?? thickness, bottom: bottom ?? thickness, frameColors })
    return
  }

  const outerX = x - thickness
  const outerY = y - thickness
  const outerW = w + thickness * 2
  const outerH = h + thickness * 2
  const { base, border, smallAccent } = frameColors

  ctx.save()
  // Clip to the frame band (outer rect minus inner photo rect) so texture
  // drawing never bleeds onto the photo itself.
  ctx.beginPath()
  ctx.rect(outerX, outerY, outerW, outerH)
  ctx.rect(x, y, w, h)
  ctx.clip('evenodd')

  // base fill for every style (70% rule: base/neutral dominates the frame area)
  ctx.fillStyle = base
  ctx.fillRect(outerX, outerY, outerW, outerH)

  if (style === 'solid') {
    ctx.fillStyle = border
    ctx.fillRect(outerX, outerY, outerW, outerH)
  } else if (style === 'stripes') {
    const stripeW = Math.max(10, thickness * 0.35)
    ctx.fillStyle = border
    ctx.save()
    ctx.translate(outerX + outerW / 2, outerY + outerH / 2)
    ctx.rotate(-Math.PI / 4)
    const diag = Math.max(outerW, outerH) * 2
    for (let sx = -diag; sx < diag; sx += stripeW * 2) {
      ctx.fillRect(sx, -diag, stripeW, diag * 2)
    }
    ctx.restore()
  } else if (style === 'dots') {
    ctx.fillStyle = border
    ctx.fillRect(outerX, outerY, outerW, outerH)
    const spacing = Math.max(16, thickness * 0.5)
    const dotR = spacing * 0.24
    ctx.fillStyle = smallAccent
    for (let row = 0, ry = outerY + spacing / 2; ry < outerY + outerH + spacing; ry += spacing, row++) {
      const offset = row % 2 === 0 ? 0 : spacing / 2
      for (let rx = outerX + spacing / 2 - offset; rx < outerX + outerW + spacing; rx += spacing) {
        ctx.beginPath()
        ctx.arc(rx, ry, dotR, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  } else if (style === 'grain') {
    // matte paper: base fill + subtle border ring + light noise speckle
    ctx.fillStyle = border
    ctx.globalAlpha = 0.9
    ctx.fillRect(outerX, outerY, outerW, outerH)
    ctx.globalAlpha = 1
    drawGrainNoise(ctx, outerX, outerY, outerW, outerH, base, 0.05)
  } else if (style === 'glossy') {
    // flash/nightlife: saturated border + soft diagonal highlight sweep
    ctx.fillStyle = border
    ctx.fillRect(outerX, outerY, outerW, outerH)
    const grad = ctx.createLinearGradient(outerX, outerY, outerX + outerW, outerY + outerH)
    grad.addColorStop(0, 'rgba(255,255,255,0.35)')
    grad.addColorStop(0.35, 'rgba(255,255,255,0.05)')
    grad.addColorStop(0.5, 'rgba(255,255,255,0)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(outerX, outerY, outerW, outerH)
    ctx.fillStyle = smallAccent
    ctx.fillRect(outerX, outerY, outerW, Math.max(3, thickness * 0.06))
  } else if (style === 'faded') {
    // rough/faded print: desaturated border + heavier noise + soft vignette
    ctx.fillStyle = border
    ctx.globalAlpha = 0.75
    ctx.fillRect(outerX, outerY, outerW, outerH)
    ctx.globalAlpha = 1
    drawGrainNoise(ctx, outerX, outerY, outerW, outerH, base, 0.09)
  }

  ctx.restore()

  // subtle inner edge to separate frame from photo
  ctx.save()
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, w, h)
  ctx.restore()
}

function drawGrainNoise(ctx, x, y, w, h, color, density) {
  ctx.save()
  ctx.fillStyle = color
  const count = Math.floor(w * h * density * 0.02)
  for (let i = 0; i < count; i++) {
    const px = x + Math.random() * w
    const py = y + Math.random() * h
    const r = Math.random() * 1.2 + 0.3
    ctx.globalAlpha = 0.15 + Math.random() * 0.2
    ctx.beginPath()
    ctx.arc(px, py, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

// Classic instant-photo card: thin white/cream margin on top and sides,
// a much thicker bottom margin (where the caption sits), a faint paper
// grain, and a soft drop shadow so it reads as a physical printed card
// rather than just another border style.
function drawPolaroidCard(ctx, { x, y, w, h, side, top, bottom, frameColors }) {
  const outerX = x - side
  const outerY = y - top
  const outerW = w + side * 2
  const outerH = h + top + bottom
  // Polaroid card stock is always a neutral white/cream — it doesn't
  // adopt the photo's palette the way the other frame styles do, since
  // that's the one visually "correct" thing about a real Polaroid border.
  const cardColor = frameColors?.quoteBackground && isLight(frameColors.quoteBackground)
    ? frameColors.quoteBackground
    : '#faf8f2'

  ctx.save()
  // soft drop shadow behind the whole card
  ctx.shadowColor = 'rgba(0,0,0,0.18)'
  ctx.shadowBlur = Math.max(8, side * 1.5)
  ctx.shadowOffsetY = Math.max(3, side * 0.4)
  ctx.fillStyle = cardColor
  ctx.fillRect(outerX, outerY, outerW, outerH)
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // subtle paper grain across the card stock (not the photo itself)
  ctx.save()
  ctx.beginPath()
  ctx.rect(outerX, outerY, outerW, outerH)
  ctx.rect(x, y, w, h)
  ctx.clip('evenodd')
  drawGrainNoise(ctx, outerX, outerY, outerW, outerH, '#000', 0.02)
  ctx.restore()

  // faint inset line separating card stock from the photo
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'
  ctx.lineWidth = 1
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
  ctx.restore()
}

function isLight(hex) {
  const n = hex.replace('#', '')
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 180
}
