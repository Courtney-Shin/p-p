// Photo palette extraction and frame color selection.
//
// Rather than using the single most common pixel color (which tends to be
// muddy brown/grey/skin-tone/dark-green), this clusters sampled colors into
// four roles — dominant, secondary, accent, neutral — and derives frame
// colors from them with brightness/saturation adjustments so the frame
// stays visually separate from the photo instead of blending into it.

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

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
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

function toHex({ r, g, b }) {
  const h = (n) => n.toString(16).padStart(2, '0')
  return `#${h(clampByte(r))}${h(clampByte(g))}${h(clampByte(b))}`
}

function clampByte(n) {
  return Math.min(255, Math.max(0, Math.round(n)))
}

function clamp01(n) {
  return Math.min(1, Math.max(0, n))
}

// Rough skin-tone band in HSL to steer frame colors away from (so a frame
// doesn't read as an odd skin-colored blob when it's just averaging faces).
function isSkinToneish(h, s, l) {
  return h >= 10 && h <= 40 && s >= 0.2 && s <= 0.7 && l >= 0.4 && l <= 0.85
}

// Extracts a 4-role palette from sampled pixel data (an ImageData-like
// {data, width, height}). Buckets colors, ranks by frequency, and assigns
// dominant/secondary/accent/neutral so frame theming has something better
// than "most common pixel."
export function extractPalette(imageData) {
  const { data } = imageData
  const buckets = new Map() // key -> { count, r, g, b, h, s, l }

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]
    if (alpha < 10) continue
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const { h, s, l } = rgbToHsl(r, g, b)
    const key = `${Math.round(r / 24)},${Math.round(g / 24)},${Math.round(b / 24)}`
    const existing = buckets.get(key)
    if (existing) {
      existing.count++
    } else {
      buckets.set(key, { count: 1, r, g, b, h, s, l })
    }
  }

  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count)

  // Dominant: most frequent broad color that isn't washed-out/near-white or
  // near-black (those make poor "dominant" anchors even if common).
  const dominant =
    sorted.find((c) => c.l > 0.12 && c.l < 0.92 && c.s > 0.12) || sorted[0] || { h: 210, s: 0.3, l: 0.5 }

  // Secondary: next most frequent color with a visibly different hue from
  // dominant (avoids picking two near-identical shades of the same color).
  const secondary =
    sorted.find((c) => c !== dominant && hueDistance(c.h, dominant.h) > 25 && c.s > 0.08) ||
    sorted.find((c) => c !== dominant) ||
    dominant

  // Accent: a comparatively rare but punchy (saturated) color — the "red
  // chair" or "yellow flower" in the frame, not part of the broad palette.
  const accentPool = sorted.filter((c) => c.s > 0.45 && c.l > 0.25 && c.l < 0.8)
  const accent = accentPool[Math.floor(accentPool.length * 0.15)] || accentPool[0] || dominant

  // Neutral: a safe, low-saturation tone for text/background — prefer
  // something light for contrast, derived from the dominant hue so it still
  // feels related to the photo rather than generic grey.
  const neutralL = dominant.l > 0.5 ? 0.94 : 0.14
  const neutral = { h: dominant.h, s: Math.min(dominant.s, 0.12), l: neutralL }

  return {
    dominant: toHex(hslToRgb(dominant.h, dominant.s, dominant.l)),
    secondary: toHex(hslToRgb(secondary.h, secondary.s, secondary.l)),
    accent: toHex(hslToRgb(accent.h, accent.s, accent.l)),
    neutral: toHex(hslToRgb(neutral.h, neutral.s, neutral.l)),
    _hsl: { dominant, secondary, accent, neutral },
  }
}

function hueDistance(h1, h2) {
  const d = Math.abs(h1 - h2) % 360
  return d > 180 ? 360 - d : d
}

// Color-wheel relationships (degrees on the hue ring), used to pick the
// frame's accent/border hues relative to the photo's dominant hue instead
// of just reusing whatever rare pixel happened to be sampled.
const COMPLEMENTARY = 180
const SPLIT_COMPLEMENTARY = 150 // (and its mirror, -150 / 210)
const ANALOGOUS = 30

function rotateHue(h, degrees) {
  return ((h + degrees) % 360 + 360) % 360
}

// Derives an actual frame color scheme from a photo palette using basic
// color-wheel theory:
// - border: analogous to the dominant hue, so it reads as "belonging" to
//   the photo while still shifted in brightness/saturation to stay distinct
// - smallAccent: the dominant hue's complement (180°) when the photo's own
//   sampled accent is too weak/close to dominant to pop on its own — a true
//   complementary color guarantees contrast instead of hoping a rare pixel
//   happened to be interesting
// - quote text/background: always neutral, never pulled from the wheel, so
//   legibility never depends on the color math working out
export function frameColorsFromPalette(palette, { bright } = {}) {
  const { dominant, secondary, accent } = palette._hsl

  const isDarkPhoto = bright === undefined ? dominant.l < 0.4 : !bright

  let baseHsl = pickNonSkinBase(dominant, secondary)
  // Push brightness away from the photo's own tone by 12-25% so the frame
  // reads as a distinct object, not a continuation of the image.
  const shift = 0.12 + Math.random() * 0.13
  baseHsl = {
    h: baseHsl.h,
    s: baseHsl.s * 0.55, // reduce saturation for large frame areas
    l: isDarkPhoto ? clamp01(baseHsl.l + shift) : clamp01(baseHsl.l - shift),
  }

  // Border: analogous to dominant (±30°) rather than identical, so it
  // relates to the photo without flattening into a single-hue frame.
  const borderHsl = {
    h: rotateHue(dominant.h, ANALOGOUS * (Math.random() < 0.5 ? 1 : -1)),
    s: Math.min(0.75, dominant.s + 0.1),
    l: isDarkPhoto ? clamp01(dominant.l + 0.15) : clamp01(dominant.l * 0.75),
  }

  // Accent: use the sampled accent color only if it's already meaningfully
  // apart from dominant on the wheel (i.e. a genuine standout pixel, like a
  // red chair in a green photo); otherwise fall back to the true
  // complementary of the dominant hue so the accent is guaranteed to pop.
  const accentIsDistinct = hueDistance(accent.h, dominant.h) > 60 && accent.s > 0.4
  const accentHueSource = accentIsDistinct
    ? accent
    : { h: rotateHue(dominant.h, COMPLEMENTARY), s: 0.7, l: 0.55 }
  const accentHsl = {
    h: accentHueSource.h,
    s: Math.max(accentHueSource.s, 0.55),
    l: clamp01(accentHueSource.l),
  }

  const quoteBg = isDarkPhoto ? { h: baseHsl.h, s: 0.08, l: 0.12 } : { h: baseHsl.h, s: 0.15, l: 0.96 }
  const quoteText = isDarkPhoto ? { h: baseHsl.h, s: 0.05, l: 0.92 } : { h: baseHsl.h, s: 0.2, l: 0.16 }

  return {
    base: toHex(hslToRgb(baseHsl.h, baseHsl.s, baseHsl.l)),
    border: toHex(hslToRgb(borderHsl.h, borderHsl.s, borderHsl.l)),
    smallAccent: toHex(hslToRgb(accentHsl.h, accentHsl.s, accentHsl.l)),
    quoteBackground: toHex(hslToRgb(quoteBg.h, quoteBg.s, quoteBg.l)),
    quoteText: toHex(hslToRgb(quoteText.h, quoteText.s, quoteText.l)),
  }
}

// Exposed for callers (e.g. sticker color selection) that want a
// guaranteed-contrasting complement of an arbitrary hue, not just the frame.
export function complementaryHex(hex) {
  const { h, s, l } = hexToHsl(hex)
  return toHex(hslToRgb(rotateHue(h, COMPLEMENTARY), s, l))
}

export function splitComplementaryHex(hex) {
  const { h, s, l } = hexToHsl(hex)
  const sign = Math.random() < 0.5 ? 1 : -1
  return toHex(hslToRgb(rotateHue(h, SPLIT_COMPLEMENTARY * sign), s, l))
}

function hexToHsl(hex) {
  const n = hex.replace('#', '')
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return rgbToHsl(r, g, b)
}

function pickNonSkinBase(dominant, secondary) {
  if (!isSkinToneish(dominant.h, dominant.s, dominant.l)) return dominant
  if (!isSkinToneish(secondary.h, secondary.s, secondary.l)) return secondary
  // both skin-toneish (e.g. a portrait-heavy photo) — rotate hue away from
  // the skin band rather than using it directly
  return { h: (dominant.h + 140) % 360, s: dominant.s, l: dominant.l }
}
