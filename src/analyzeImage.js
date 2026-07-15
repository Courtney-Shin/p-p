// Client-side photo analysis: samples pixels from a downscaled copy of the
// image to derive average brightness/saturation/hue and picks a matching
// mood + a small palette of dominant colors, with no network calls.

function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  const d = max - min
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case r:
        h = ((g - b) / d) % 6
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s, l }
}

function quantizeColor(r, g, b, bucket = 32) {
  return [
    Math.round(r / bucket) * bucket,
    Math.round(g / bucket) * bucket,
    Math.round(b / bucket) * bucket,
  ]
}

export function analyzeImage(imgEl) {
  const SAMPLE_SIZE = 64
  const canvas = document.createElement('canvas')
  canvas.width = SAMPLE_SIZE
  canvas.height = SAMPLE_SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(imgEl, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
  const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)

  let totalL = 0
  let totalS = 0
  let warmCount = 0
  let coolCount = 0
  let greenCount = 0
  let pinkCount = 0
  let cyanCount = 0
  let vividDarkCount = 0
  let n = 0
  const colorCounts = new Map()
  const lightnessValues = []

  // top-band stats (top 25% of the image) to spot sky-like regions
  let topTotalL = 0
  let topWarmCount = 0
  let topCoolCount = 0
  let topN = 0
  const topBandRows = Math.floor(SAMPLE_SIZE * 0.25)

  for (let y = 0; y < SAMPLE_SIZE; y++) {
    for (let x = 0; x < SAMPLE_SIZE; x++) {
      const i = (y * SAMPLE_SIZE + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const alpha = data[i + 3]
      if (alpha < 10) continue

      const { h, s, l } = rgbToHsl(r, g, b)
      totalL += l
      totalS += s
      lightnessValues.push(l)
      n++

      // warm hues: red/orange/yellow (~0-70, 330-360); cool: blue/green/purple
      const isWarm = (h >= 0 && h <= 70) || h >= 330
      const isCool = h >= 150 && h <= 300
      if (isWarm) warmCount++
      else if (isCool) coolCount++
      // green band specifically (foliage)
      if (h >= 70 && h <= 160 && s > 0.15) greenCount++
      // pink/magenta band (romantic)
      if (((h >= 300 && h <= 345) || (h >= 340 && h <= 360)) && s > 0.25 && l > 0.4) pinkCount++
      // cyan/turquoise band (beach water)
      if (h >= 180 && h <= 210 && s > 0.3) cyanCount++
      // saturated color in a dark image (neon against night)
      if (l < 0.35 && s > 0.5) vividDarkCount++

      if (y < topBandRows) {
        topTotalL += l
        topN++
        if (isWarm) topWarmCount++
        else if (isCool) topCoolCount++
      }

      const [qr, qg, qb] = quantizeColor(r, g, b)
      const key = `${qr},${qg},${qb}`
      colorCounts.set(key, (colorCounts.get(key) || 0) + 1)
    }
  }

  const avgL = n ? totalL / n : 0.5
  const avgS = n ? totalS / n : 0.3
  const warmRatio = n ? warmCount / n : 0.5
  const coolRatio = n ? coolCount / n : 0.5
  const greenRatio = n ? greenCount / n : 0
  const pinkRatio = n ? pinkCount / n : 0
  const cyanRatio = n ? cyanCount / n : 0
  const vividDarkRatio = n ? vividDarkCount / n : 0
  const topAvgL = topN ? topTotalL / topN : avgL
  const topWarmRatio = topN ? topWarmCount / topN : warmRatio
  const topCoolRatio = topN ? topCoolCount / topN : coolRatio

  // color variance: how "flat" the image is (low variance = plain wall/backdrop)
  const meanL = avgL
  const variance = n
    ? lightnessValues.reduce((sum, l) => sum + (l - meanL) ** 2, 0) / n
    : 0

  const dominant = [...colorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key]) => {
      const [r, g, b] = key.split(',').map(Number)
      return `rgb(${r}, ${g}, ${b})`
    })
  const uniqueColorCount = colorCounts.size

  const mood = pickMood({ avgL, avgS, warmRatio, coolRatio, pinkRatio, cyanRatio, vividDarkRatio })
  const scene = pickScene({
    avgL,
    avgS,
    warmRatio,
    coolRatio,
    greenRatio,
    topAvgL,
    topWarmRatio,
    topCoolRatio,
    variance,
    uniqueColorCount,
  })

  return { mood, scene, avgL, avgS, warmRatio, coolRatio, dominant, variance, imageData: ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE) }
}

// Best-effort scene guess from color/region statistics only — this is not
// object detection, just a heuristic starting point the user can override.
function pickScene({
  avgL,
  avgS,
  greenRatio,
  topAvgL,
  topWarmRatio,
  topCoolRatio,
  variance,
  uniqueColorCount,
}) {
  // Sky-like top band: bright/warm (sunset) or bright/cool (blue sky) top,
  // distinctly different from a flat indoor shot.
  const skyTopWarm = topAvgL > 0.5 && topWarmRatio > 0.4
  const skyTopBlue = topAvgL > 0.55 && topCoolRatio > 0.45
  if (skyTopWarm || skyTopBlue) return 'landscape'

  // Lots of green -> foliage/nature
  if (greenRatio > 0.22) return 'nature'

  // Very flat, low-variance image with few distinct colors -> plain wall/backdrop
  if (variance < 0.01 && uniqueColorCount < 40 && avgS < 0.25) return 'wall'

  // Low overall detail/very blurry-looking (still low variance but some
  // color spread) -> could be motion blur; treat conservatively
  if (variance < 0.006) return 'blurry'

  return 'generic'
}

function pickMood({ avgL, avgS, warmRatio, coolRatio, pinkRatio, cyanRatio, vividDarkRatio }) {
  // Dark + saturated neon colors -> urban night, distinct from plain moody
  if (avgL < 0.4 && vividDarkRatio > 0.12) return 'urban'
  // Dark images (no neon signal) -> moody
  if (avgL < 0.32) return 'moody'
  // Strong pink/magenta presence -> romantic
  if (pinkRatio > 0.16 && avgL > 0.35) return 'romantic'
  // Cyan/turquoise water tones + bright -> beach
  if (cyanRatio > 0.18 && avgL > 0.45) return 'beach'
  // Low saturation, mid-high lightness -> calm
  if (avgS < 0.22 && avgL > 0.45) return 'calm'
  // Very light + moderate saturation -> dreamy (pastel-ish)
  if (avgL > 0.72 && avgS < 0.55) return 'dreamy'
  // Warm + saturated + bright -> joyful
  if (warmRatio > 0.45 && avgS > 0.35 && avgL > 0.4) return 'joyful'
  // Cool-green dominant + saturated -> wild (nature)
  if (coolRatio > 0.4 && avgS > 0.3) return 'wild'
  // Warm, muted, mid-low lightness -> cozy
  if (warmRatio > 0.3 && avgL < 0.55) return 'cozy'
  return 'joyful'
}
