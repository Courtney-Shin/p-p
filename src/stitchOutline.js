// Traces the contour of a binary alpha mask (from backgroundRemoval.js) and
// draws a dashed "stitch" pattern along it — like the sewn edge of a
// fabric patch — so a background-removed subject reads as an appliqué
// sticker rather than a flat cutout.

// Marching-squares style contour trace: walks the mask boundary between
// "inside" (alpha > threshold) and "outside" pixels, producing an ordered
// list of {x, y} points at the mask's own resolution. Simplified to a
// Moore-neighbor boundary trace, which is enough for a single dominant
// subject blob (the common case for a segmented photo subject).
export function traceContour(mask, threshold = 128) {
  const { alpha, width, height } = mask
  const isInside = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false
    return alpha[y * width + x] >= threshold
  }

  // find a starting boundary pixel: first inside pixel scanning row-major
  let start = null
  outer: for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isInside(x, y) && !isInside(x - 1, y)) {
        start = { x, y }
        break outer
      }
    }
  }
  if (!start) return []

  // Moore-neighbor tracing (8-connectivity), clockwise
  const directions = [
    [1, 0], [1, 1], [0, 1], [-1, 1],
    [-1, 0], [-1, -1], [0, -1], [1, -1],
  ]
  const contour = [start]
  let current = start
  let backtrack = 4 // direction we arrived from, so we start searching from behind it
  const maxSteps = width * height * 4
  let steps = 0

  while (steps++ < maxSteps) {
    let found = false
    for (let i = 0; i < 8; i++) {
      const dirIdx = (backtrack + i) % 8
      const [dx, dy] = directions[dirIdx]
      const nx = current.x + dx
      const ny = current.y + dy
      if (isInside(nx, ny)) {
        current = { x: nx, y: ny }
        contour.push(current)
        backtrack = (dirIdx + 5) % 8 // look-back direction for next step
        found = true
        break
      }
    }
    if (!found) break
    if (current.x === start.x && current.y === start.y && contour.length > 2) break
  }

  return contour
}

// Simplifies a contour by dropping points closer than `spacing` apart, so
// the stitch pattern has consistent visual rhythm instead of clustering on
// noisy mask edges.
function resamplePath(points, spacing) {
  if (points.length < 2) return points
  const result = [points[0]]
  let last = points[0]
  for (let i = 1; i < points.length; i++) {
    const p = points[i]
    const dist = Math.hypot(p.x - last.x, p.y - last.y)
    if (dist >= spacing) {
      result.push(p)
      last = p
    }
  }
  return result
}

// Draws a dashed stitch line along the contour onto a canvas context. The
// contour is in mask-pixel space; scaleX/scaleY map it to canvas space
// (since the mask may be lower-resolution than the display canvas).
export function drawStitchOutline(ctx, contour, { scaleX, scaleY, offsetX = 0, offsetY = 0, color = '#ffffff', dashLength = 6, gapLength = 5, lineWidth = 2 }) {
  if (contour.length < 2) return

  const scaled = contour.map((p) => ({
    x: p.x * scaleX + offsetX,
    y: p.y * scaleY + offsetY,
  }))
  const spacedSteps = Math.max(2, dashLength * 0.6)
  const points = resamplePath(scaled, spacedSteps)

  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.setLineDash([dashLength, gapLength])

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.closePath()
  ctx.stroke()

  // a faint shadow pass offset slightly gives the stitches a raised-thread
  // look rather than reading as a flat dashed border
  ctx.setLineDash([dashLength, gapLength])
  ctx.lineDashOffset = dashLength / 2
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'
  ctx.lineWidth = Math.max(1, lineWidth * 0.6)
  ctx.beginPath()
  ctx.moveTo(points[0].x + 1, points[0].y + 1)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x + 1, points[i].y + 1)
  }
  ctx.closePath()
  ctx.stroke()

  ctx.restore()
}
