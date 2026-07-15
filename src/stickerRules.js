// Sticker selection and placement rules: how many stickers to use, what mix
// of contextual/mood/accent, what order to prioritize them in, where they're
// allowed to go, and how much of the image they're allowed to cover.
//
// Object-specific placement (avoid faces/hands/food-being-featured) needs
// real detection we don't have; `detection.subjectZone` is a coarse
// center-of-frame proxy used as a stand-in "don't cover this" region until
// a real vision call can supply actual face/subject boxes.

import { MOOD_MOTION_STICKERS, UNEXPECTED_ACCENT_STICKERS } from './stickers'

// §7 sticker count table, keyed by a coarse photo-type guess.
export const STICKER_COUNT_RANGES = {
  portrait: [2, 4],
  pair: [3, 5],
  group: [3, 6],
  object: [2, 4],
  landscape: [2, 5],
  busy: [1, 3],
}

// §9 coverage limit, fraction of image area, keyed by the same photo type
// buckets (collapsed to the three cases the spec gives).
export const COVERAGE_LIMITS = {
  portrait: 0.08,
  pair: 0.08,
  group: 0.06, // "visually crowded group photos" reads as the group case
  object: 0.12,
  landscape: 0.12,
  busy: 0.06,
}

// Best-effort photo-type guess from what we actually know (scene + coarse
// variance-as-busyness proxy) since we don't have people-counting.
export function guessPhotoType({ scene, variance }) {
  if (variance !== undefined && variance > 0.05) return 'busy'
  if (scene === 'landscape' || scene === 'nature' || scene === 'park') return 'landscape'
  if (scene === 'birthday' || scene === 'cafe') return 'object'
  if (scene === 'party') return 'busy'
  if (scene === 'selfie' || scene === 'instaBack') return 'portrait'
  return 'group'
}

function pickCount([min, max]) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

// Scene -> ordered contextual sticker pool (priority order: clearly visible
// object, then environment/weather associations). Matches the existing
// per-mood sticker sets already curated in moods.js-adjacent scene lists.
const SCENE_CONTEXTUAL = {
  nature: ['leaf', 'sun', 'flower'],
  wall: ['sparkle'],
  cafe: ['mug', 'heart'],
  birthday: ['star', 'sparkle', 'heart', 'cakeSlice', 'ribbon'],
  landscape: ['sun', 'wave', 'droplet'],
  pet: ['heart', 'sparkle', 'pawPrint'],
  blurry: ['sparkle'],
  selfie: ['sparkle', 'heart', 'flash'],
  instaBack: ['cloud', 'sparkle', 'sun'],
  park: ['leaf', 'sun', 'cloud'],
  street: ['camera', 'ribbon', 'star'],
  party: ['musicNote', 'flash', 'star', 'crown'],
  generic: ['star', 'sparkle', 'heart'],
}

// Builds a sticker selection following the 60% contextual / 20% mood-motion
// / 20% unexpected-accent mix, deduplicated so we don't pick five things
// that all say the same thing (e.g. cake + cupcake + balloon).
export function selectStickers({ scene, photoType, palette }) {
  const [min, max] = STICKER_COUNT_RANGES[photoType] || STICKER_COUNT_RANGES.group
  const total = pickCount([min, max])

  const contextualCount = Math.max(1, Math.round(total * 0.6))
  const moodCount = Math.max(0, Math.round(total * 0.2))
  const accentCount = Math.max(0, total - contextualCount - moodCount)

  const contextualPool = SCENE_CONTEXTUAL[scene] || SCENE_CONTEXTUAL.generic
  const contextual = sampleUnique(contextualPool, contextualCount)
  const mood = sampleUnique(MOOD_MOTION_STICKERS, moodCount)
  const accent = sampleUnique(UNEXPECTED_ACCENT_STICKERS, accentCount)

  const colors = palette ? [palette.dominant, palette.secondary, palette.accent] : ['#888']

  return [...contextual, ...mood, ...accent].map((name, i) => ({
    name,
    color: colors[i % colors.length],
  }))
}

function sampleUnique(pool, count) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  const picked = []
  for (let i = 0; i < count; i++) {
    picked.push(shuffled[i % shuffled.length])
  }
  return picked
}

// Placement zones: corners (large stickers), negative space near frame edge
// (small/contextual), around the quote panel. Coordinates are fractions of
// the full canvas (matching the sticker.x/y convention already in App.jsx).
const CORNER_ZONES = [
  { x: 0.1, y: 0.1 },
  { x: 0.9, y: 0.1 },
  { x: 0.1, y: 0.62 },
  { x: 0.9, y: 0.62 },
]

const EDGE_ZONES = [
  { x: 0.5, y: 0.06 },
  { x: 0.06, y: 0.4 },
  { x: 0.94, y: 0.4 },
]

// Returns a placement {x, y} that avoids the subject zone, preferring
// corners for larger stickers and edges/negative-space for smaller ones.
export function placeSticker({ index, radius, subjectZone }) {
  const pool = radius > 0.06 ? CORNER_ZONES : EDGE_ZONES
  const base = pool[index % pool.length]
  // small jitter so repeated stickers in the same zone don't stack exactly
  const jitterX = (Math.random() - 0.5) * 0.04
  const jitterY = (Math.random() - 0.5) * 0.04
  let x = clamp01(base.x + jitterX)
  let y = clamp01(base.y + jitterY)

  if (subjectZone && isInsideZone(x, y, subjectZone)) {
    // push outward away from center if we'd land on the subject zone
    x = x < 0.5 ? subjectZone.x - 0.05 : subjectZone.x + subjectZone.w + 0.05
    x = clamp01(x)
  }

  return { x, y }
}

function isInsideZone(x, y, zone) {
  return x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h
}

function clamp01(v) {
  return Math.min(1, Math.max(0, v))
}

// Checks whether a set of stickers stays under the coverage cap; returns
// the subset that fits if not (drops lowest-priority/last stickers first).
export function enforceCoverageLimit(stickers, photoType, canvasArea) {
  const limit = COVERAGE_LIMITS[photoType] ?? 0.1
  let usedArea = 0
  const kept = []
  for (const s of stickers) {
    const area = Math.PI * (s.radius * Math.min(canvasArea.w, canvasArea.h)) ** 2
    const fraction = area / (canvasArea.w * canvasArea.h)
    if (usedArea + fraction > limit) continue
    usedArea += fraction
    kept.push(s)
  }
  return kept
}
