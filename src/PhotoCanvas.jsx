import { useEffect, useImperativeHandle, forwardRef, useCallback, useRef } from 'react'
import { drawFrame } from './frames'
import { drawSticker } from './stickers'
import { drawPhotoOverlay } from './photoOverlay'
import { fontCssValue } from './fonts'

const FRAME_THICKNESS_RATIO = 0.06
const QUOTE_BAND_RATIO = 0.12

// crude CJK detector: if the quote contains Hangul, use Korean-friendly type.
function containsHangul(str) {
  return /[가-힣]/.test(str)
}

// Renders the photo + frame + stickers + quote onto a single canvas.
// Exposes layout/export helpers to the parent via ref.
const PhotoCanvas = forwardRef(function PhotoCanvas(
  { image, frameColors, frameStyle, photoOverlay, stickers, quote, captionFont, canvasSize },
  ref
) {
  const canvasRef = useRef(null)
  const { width, height } = canvasSize

  const layout = useCallback(() => {
    const thickness = Math.round(Math.min(width, height) * FRAME_THICKNESS_RATIO)
    const quoteBand = Math.round(height * QUOTE_BAND_RATIO)
    const photoX = thickness
    const photoY = thickness
    const photoW = width - thickness * 2
    const photoH = height - thickness * 2 - quoteBand
    return { thickness, quoteBand, photoX, photoY, photoW, photoH }
  }, [width, height])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)

    const bgColor = frameColors?.quoteBackground || '#faf7f2'
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)

    const { thickness, quoteBand, photoX, photoY, photoW, photoH } = layout()

    // draw photo, cover-fit into the photo rect
    const imgRatio = image.width / image.height
    const boxRatio = photoW / photoH
    let sx, sy, sw, sh
    if (imgRatio > boxRatio) {
      sh = image.height
      sw = sh * boxRatio
      sx = (image.width - sw) / 2
      sy = 0
    } else {
      sw = image.width
      sh = sw / boxRatio
      sx = 0
      sy = (image.height - sh) / 2
    }
    ctx.save()
    ctx.beginPath()
    ctx.rect(photoX, photoY, photoW, photoH)
    ctx.clip()
    ctx.drawImage(image, sx, sy, sw, sh, photoX, photoY, photoW, photoH)
    ctx.restore()

    // glossy/grain overlays apply to the photo itself, not the frame border
    drawPhotoOverlay(ctx, {
      x: photoX,
      y: photoY,
      w: photoW,
      h: photoH,
      style: photoOverlay,
    })

    drawFrame(ctx, {
      x: photoX,
      y: photoY,
      w: photoW,
      h: photoH,
      thickness,
      style: frameStyle,
      frameColors,
    })

    // stickers (positions are stored as fractions of the full canvas)
    stickers.forEach((s) => {
      drawSticker(
        ctx,
        s.name,
        s.x * width,
        s.y * height,
        s.radius * Math.min(width, height),
        s.color,
        s.rotation
      )
    })

    // quote band at the bottom
    if (quote) {
      ctx.save()
      ctx.fillStyle = frameColors?.quoteText || '#2b2b2b'
      const isKorean = containsHangul(quote)
      const font = captionFont || { family: isKorean ? 'NanumHandwriting' : 'BunnyCaption', fallback: isKorean ? '"Apple SD Gothic Neo", sans-serif' : 'Georgia, serif' }
      ctx.font = fontCssValue(font, Math.round(quoteBand * 0.34))
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const maxWidth = width - thickness * 2
      const quoteText = isKorean ? quote : `"${quote}"`
      wrapText(ctx, quoteText, width / 2, height - quoteBand / 2, maxWidth, quoteBand * (isKorean ? 0.38 : 0.4))
      ctx.restore()
    }
  }, [image, frameColors, frameStyle, photoOverlay, stickers, quote, captionFont, width, height, layout])

  useEffect(() => {
    // document.fonts.ready alone doesn't guarantee a specific @font-face
    // (self-hosted or Google-linked) has finished downloading — load() the
    // one actually in use, then render, so the caption never silently falls
    // back to the default sans/serif on first paint.
    let cancelled = false
    const family = captionFont?.family
    if (document.fonts?.load && family) {
      document.fonts.load(`16px "${family}"`).finally(() => {
        if (!cancelled) render()
      })
    } else {
      render()
    }
    return () => {
      cancelled = true
    }
  }, [render, captionFont])

  useImperativeHandle(ref, () => ({
    render,
    layout,
    exportDataURL: () => canvasRef.current?.toDataURL('image/png'),
    getCanvas: () => canvasRef.current,
  }))

  return <canvas ref={canvasRef} width={width} height={height} className="photo-canvas" />
})

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  const totalH = lines.length * lineHeight
  const startY = y - totalH / 2 + lineHeight / 2
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight))
}

export default PhotoCanvas
