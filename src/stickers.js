// Custom sticker set. Each sticker is a small drawing function that renders
// into a canvas 2D context inside a unit box (-1..1), so it can be scaled
// and positioned freely when placed on the photo.

function star(ctx, color) {
  ctx.beginPath()
  const spikes = 5
  const outerR = 1
  const innerR = 0.42
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = (Math.PI / spikes) * i - Math.PI / 2
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function sparkle(ctx, color) {
  ctx.beginPath()
  ctx.moveTo(0, -1)
  ctx.quadraticCurveTo(0.12, -0.12, 1, 0)
  ctx.quadraticCurveTo(0.12, 0.12, 0, 1)
  ctx.quadraticCurveTo(-0.12, 0.12, -1, 0)
  ctx.quadraticCurveTo(-0.12, -0.12, 0, -1)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function heart(ctx, color) {
  ctx.beginPath()
  ctx.moveTo(0, 0.35)
  ctx.bezierCurveTo(-0.6, -0.35, -1.1, 0.55, 0, 1)
  ctx.bezierCurveTo(1.1, 0.55, 0.6, -0.35, 0, 0.35)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function sun(ctx, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(0, 0, 0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 0.18
  ctx.lineCap = 'round'
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i
    ctx.beginPath()
    ctx.moveTo(Math.cos(angle) * 0.7, Math.sin(angle) * 0.7)
    ctx.lineTo(Math.cos(angle) * 1, Math.sin(angle) * 1)
    ctx.stroke()
  }
}

function moon(ctx, color) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 0, 1, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(0.45, -0.25, 0.85, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function leaf(ctx, color) {
  ctx.beginPath()
  ctx.moveTo(0, -1)
  ctx.quadraticCurveTo(1, -0.4, 0, 1)
  ctx.quadraticCurveTo(-1, -0.4, 0, -1)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.lineWidth = 0.05
  ctx.beginPath()
  ctx.moveTo(0, -0.9)
  ctx.lineTo(0, 0.9)
  ctx.stroke()
}

function flower(ctx, color) {
  for (let i = 0; i < 5; i++) {
    const angle = ((Math.PI * 2) / 5) * i
    ctx.save()
    ctx.rotate(angle)
    ctx.beginPath()
    ctx.ellipse(0, -0.55, 0.32, 0.5, 0, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.restore()
  }
  ctx.beginPath()
  ctx.arc(0, 0, 0.3, 0, Math.PI * 2)
  ctx.fillStyle = '#FFD166'
  ctx.fill()
}

function wave(ctx, color) {
  ctx.strokeStyle = color
  ctx.lineWidth = 0.28
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-1, 0.3)
  ctx.quadraticCurveTo(-0.5, -0.6, 0, 0.3)
  ctx.quadraticCurveTo(0.5, -0.6, 1, 0.3)
  ctx.stroke()
}

function droplet(ctx, color) {
  ctx.beginPath()
  ctx.moveTo(0, -1)
  ctx.quadraticCurveTo(0.85, 0.4, 0, 1)
  ctx.quadraticCurveTo(-0.85, 0.4, 0, -1)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function balloon(ctx, color) {
  ctx.beginPath()
  ctx.ellipse(0, -0.15, 0.7, 0.85, 0, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 0.06
  ctx.beginPath()
  ctx.moveTo(0, 0.68)
  ctx.lineTo(0, 1.05)
  ctx.stroke()
}

function mug(ctx, color) {
  ctx.fillStyle = color
  ctx.fillRect(-0.6, -0.6, 1.0, 1.2)
  ctx.strokeStyle = color
  ctx.lineWidth = 0.16
  ctx.beginPath()
  ctx.arc(0.55, 0, 0.4, -Math.PI / 2, Math.PI / 2)
  ctx.stroke()
}

// motion line accent (mood/motion category)
function motionLine(ctx, color) {
  ctx.strokeStyle = color
  ctx.lineWidth = 0.16
  ctx.lineCap = 'round'
  for (let i = 0; i < 3; i++) {
    const yOff = -0.5 + i * 0.5
    ctx.beginPath()
    ctx.moveTo(-1, yOff)
    ctx.lineTo(0.4 - i * 0.15, yOff)
    ctx.stroke()
  }
}

// small flash/glint accent (mood/motion category)
function flash(ctx, color) {
  ctx.beginPath()
  ctx.moveTo(0.15, -1)
  ctx.lineTo(-0.5, 0.15)
  ctx.lineTo(-0.05, 0.15)
  ctx.lineTo(-0.15, 1)
  ctx.lineTo(0.55, -0.1)
  ctx.lineTo(0.1, -0.1)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

// tiny office chair — the "unexpected accent" sticker per the sticker mix
// guidelines: a slightly unrelated object that reads as a small joke.
function chair(ctx, color) {
  ctx.strokeStyle = color
  ctx.lineWidth = 0.14
  ctx.lineCap = 'round'
  ctx.strokeRect(-0.55, -0.75, 1.1, 0.6)
  ctx.beginPath()
  ctx.moveTo(-0.55, -0.15)
  ctx.lineTo(-0.55, 0.75)
  ctx.moveTo(0.55, -0.15)
  ctx.lineTo(0.55, 0.75)
  ctx.moveTo(-0.55, 0.75)
  ctx.lineTo(-0.75, 1)
  ctx.moveTo(0.55, 0.75)
  ctx.lineTo(0.75, 1)
  ctx.stroke()
}

function cloud(ctx, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(-0.4, 0.15, 0.45, 0, Math.PI * 2)
  ctx.arc(0.15, -0.1, 0.55, 0, Math.PI * 2)
  ctx.arc(0.6, 0.2, 0.4, 0, Math.PI * 2)
  ctx.arc(0, 0.35, 0.5, 0, Math.PI * 2)
  ctx.fill()
}

function camera(ctx, color) {
  ctx.fillStyle = color
  ctx.fillRect(-0.9, -0.5, 1.8, 1.3)
  ctx.fillRect(-0.35, -0.85, 0.7, 0.4)
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(0, 0.1, 0.45, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
  ctx.strokeStyle = color
  ctx.lineWidth = 0.12
  ctx.beginPath()
  ctx.arc(0, 0.1, 0.45, 0, Math.PI * 2)
  ctx.stroke()
}

function musicNote(ctx, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(-0.45, 0.7, 0.4, 0.3, -0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(0.0, -1, 0.14, 1.6)
  ctx.beginPath()
  ctx.moveTo(0.14, -1)
  ctx.quadraticCurveTo(0.9, -0.9, 0.85, -0.3)
  ctx.quadraticCurveTo(0.5, -0.55, 0.14, -0.4)
  ctx.closePath()
  ctx.fill()
}

function ribbon(ctx, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(-1, -0.7)
  ctx.lineTo(-0.65, 0)
  ctx.lineTo(-1, 0.7)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(1, -0.7)
  ctx.lineTo(0.65, 0)
  ctx.lineTo(1, 0.7)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.arc(0, 0, 0.25, 0, Math.PI * 2)
  ctx.fill()
}

function crown(ctx, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(-0.9, 0.6)
  ctx.lineTo(-0.9, -0.1)
  ctx.lineTo(-0.5, 0.25)
  ctx.lineTo(0, -0.6)
  ctx.lineTo(0.5, 0.25)
  ctx.lineTo(0.9, -0.1)
  ctx.lineTo(0.9, 0.6)
  ctx.closePath()
  ctx.fill()
}

function cakeSlice(ctx, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(-0.8, 0.8)
  ctx.lineTo(0, -0.7)
  ctx.lineTo(0.8, 0.8)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fillRect(-0.8, 0.55, 1.6, 0.14)
  ctx.strokeStyle = color
  ctx.lineWidth = 0.1
  ctx.beginPath()
  ctx.moveTo(0, -0.7)
  ctx.lineTo(0, -1)
  ctx.stroke()
}

function plane(ctx, color) {
  ctx.fillStyle = color
  ctx.save()
  ctx.rotate(-Math.PI / 4)
  ctx.beginPath()
  ctx.moveTo(0, -1)
  ctx.lineTo(0.22, 0.3)
  ctx.lineTo(0.9, 0.7)
  ctx.lineTo(0.9, 0.9)
  ctx.lineTo(0.15, 0.65)
  ctx.lineTo(0.1, 1)
  ctx.lineTo(0.3, 1.15)
  ctx.lineTo(0.3, 1.3)
  ctx.lineTo(0, 1.15)
  ctx.lineTo(-0.3, 1.3)
  ctx.lineTo(-0.3, 1.15)
  ctx.lineTo(-0.1, 1)
  ctx.lineTo(-0.15, 0.65)
  ctx.lineTo(-0.9, 0.9)
  ctx.lineTo(-0.9, 0.7)
  ctx.lineTo(-0.22, 0.3)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function umbrella(ctx, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(-1, 0.1)
  ctx.quadraticCurveTo(-0.9, -0.9, 0, -0.9)
  ctx.quadraticCurveTo(0.9, -0.9, 1, 0.1)
  ctx.quadraticCurveTo(0.6, -0.15, 0.3, 0.1)
  ctx.quadraticCurveTo(0, -0.15, -0.3, 0.1)
  ctx.quadraticCurveTo(-0.6, -0.15, -1, 0.1)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 0.1
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(0, -0.85)
  ctx.lineTo(0, 0.8)
  ctx.quadraticCurveTo(0, 1.05, 0.3, 1)
  ctx.stroke()
}

function catFace(ctx, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(-1, -0.6)
  ctx.lineTo(-0.5, -1)
  ctx.lineTo(-0.35, -0.5)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(1, -0.6)
  ctx.lineTo(0.5, -1)
  ctx.lineTo(0.35, -0.5)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.arc(0, 0, 0.75, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(-0.25, -0.05, 0.08, 0, Math.PI * 2)
  ctx.arc(0.25, -0.05, 0.08, 0, Math.PI * 2)
  ctx.fill()
}

function pawPrint(ctx, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(0, 0.25, 0.5, 0.42, 0, 0, Math.PI * 2)
  ctx.fill()
  const toes = [
    [-0.55, -0.45],
    [-0.2, -0.7],
    [0.2, -0.7],
    [0.55, -0.45],
  ]
  toes.forEach(([tx, ty]) => {
    ctx.beginPath()
    ctx.ellipse(tx, ty, 0.22, 0.28, 0, 0, Math.PI * 2)
    ctx.fill()
  })
}

function lightning(ctx, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0.2, -1)
  ctx.lineTo(-0.5, 0.1)
  ctx.lineTo(-0.05, 0.1)
  ctx.lineTo(-0.2, 1)
  ctx.lineTo(0.5, -0.15)
  ctx.lineTo(0.05, -0.15)
  ctx.closePath()
  ctx.fill()
}

function ringOutline(ctx, color) {
  ctx.strokeStyle = color
  ctx.lineWidth = 0.22
  ctx.beginPath()
  ctx.arc(0, 0, 0.75, 0, Math.PI * 2)
  ctx.stroke()
}

export const STICKER_SHAPES = {
  star,
  sparkle,
  heart,
  sun,
  moon,
  leaf,
  flower,
  wave,
  droplet,
  balloon,
  mug,
  motionLine,
  flash,
  chair,
  cloud,
  camera,
  musicNote,
  ribbon,
  crown,
  cakeSlice,
  plane,
  umbrella,
  catFace,
  pawPrint,
  lightning,
  ringOutline,
}

// Category tags per shape for the 60/20/20 mix rule (contextual / mood-motion
// / unexpected-accent). "Contextual" stickers are selected per-scene in
// stickerRules.js; these two lists are the fixed, scene-independent pools.
export const MOOD_MOTION_STICKERS = ['sparkle', 'motionLine', 'flash', 'star', 'lightning', 'ringOutline']
export const UNEXPECTED_ACCENT_STICKERS = ['chair', 'mug', 'droplet', 'balloon', 'umbrella', 'plane', 'crown']

// Draw a sticker centered at (x, y) with given radius (half-size) and color.
export function drawSticker(ctx, name, x, y, radius, color, rotation = 0) {
  const shapeFn = STICKER_SHAPES[name]
  if (!shapeFn) return
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.scale(radius, radius)
  shapeFn(ctx, color)
  ctx.restore()
}
