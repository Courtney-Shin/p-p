import { useRef, useEffect, useCallback, useState } from 'react'

// A full HSV color wheel (hue = angle, saturation = radius) plus a
// lightness slider underneath, so users can pick any color rather than
// choosing from a fixed swatch set. Used for both stitch outline color and
// sticker color.

const WHEEL_SIZE = 140

function hsvToRgb(h, s, v) {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r1, g1, b1
  if (h < 60) [r1, g1, b1] = [c, x, 0]
  else if (h < 120) [r1, g1, b1] = [x, c, 0]
  else if (h < 180) [r1, g1, b1] = [0, c, x]
  else if (h < 240) [r1, g1, b1] = [0, x, c]
  else if (h < 300) [r1, g1, b1] = [x, 0, c]
  else [r1, g1, b1] = [c, 0, x]
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  }
}

function rgbToHsv(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  const v = max
  return { h, s, v }
}

function hexToRgb(hex) {
  const n = hex.replace('#', '')
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  }
}

function rgbToHex({ r, g, b }) {
  const h = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

export default function ColorWheel({ value, onChange }) {
  const canvasRef = useRef(null)
  const [hsv, setHsv] = useState(() => {
    const { r, g, b } = hexToRgb(value || '#ff0000')
    return rgbToHsv(r, g, b)
  })
  const draggingRef = useRef(false)

  // keep internal hue/sat/val in sync if the color changes from outside
  // (e.g. a swatch click) without fighting the user's own wheel drags
  useEffect(() => {
    if (draggingRef.current) return
    const { r, g, b } = hexToRgb(value || '#ff0000')
    setHsv(rgbToHsv(r, g, b))
  }, [value])

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const size = WHEEL_SIZE
    const radius = size / 2
    const cx = radius
    const cy = radius

    const imageData = ctx.createImageData(size, size)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx
        const dy = y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        const idx = (y * size + x) * 4
        if (dist <= radius) {
          let angle = (Math.atan2(dy, dx) * 180) / Math.PI
          if (angle < 0) angle += 360
          const sat = Math.min(1, dist / radius)
          const { r, g, b } = hsvToRgb(angle, sat, hsv.v)
          imageData.data[idx] = r
          imageData.data[idx + 1] = g
          imageData.data[idx + 2] = b
          imageData.data[idx + 3] = 255
        }
      }
    }
    ctx.putImageData(imageData, 0, 0)

    // selection marker
    const markerAngle = (hsv.h * Math.PI) / 180
    const markerDist = hsv.s * radius
    const mx = cx + Math.cos(markerAngle) * markerDist
    const my = cy + Math.sin(markerAngle) * markerDist
    ctx.beginPath()
    ctx.arc(mx, my, 6, 0, Math.PI * 2)
    ctx.strokeStyle = hsv.v > 0.6 ? '#000' : '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [hsv])

  useEffect(() => {
    drawWheel()
  }, [drawWheel])

  const pickFromEvent = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const x = ((clientX - rect.left) / rect.width) * WHEEL_SIZE
    const y = ((clientY - rect.top) / rect.height) * WHEEL_SIZE
    const radius = WHEEL_SIZE / 2
    const dx = x - radius
    const dy = y - radius
    const dist = Math.min(radius, Math.sqrt(dx * dx + dy * dy))
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI
    if (angle < 0) angle += 360
    const sat = dist / radius
    const next = { h: angle, s: sat, v: hsv.v }
    setHsv(next)
    onChange(rgbToHex(hsvToRgb(next.h, next.s, next.v)))
  }

  const onPointerDown = (e) => {
    draggingRef.current = true
    pickFromEvent(e)
  }
  const onPointerMove = (e) => {
    if (!draggingRef.current) return
    pickFromEvent(e)
  }
  const onPointerUp = () => {
    draggingRef.current = false
  }

  const onValueChange = (e) => {
    const v = Number(e.target.value) / 100
    const next = { ...hsv, v }
    setHsv(next)
    onChange(rgbToHex(hsvToRgb(next.h, next.s, next.v)))
  }

  return (
    <div className="color-wheel">
      <canvas
        ref={canvasRef}
        width={WHEEL_SIZE}
        height={WHEEL_SIZE}
        className="color-wheel-canvas"
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
      />
      <input
        type="range"
        min="0"
        max="100"
        value={Math.round(hsv.v * 100)}
        onChange={onValueChange}
        className="color-wheel-lightness"
        style={{
          background: `linear-gradient(to right, #000, ${rgbToHex(hsvToRgb(hsv.h, hsv.s, 1))})`,
        }}
      />
    </div>
  )
}
