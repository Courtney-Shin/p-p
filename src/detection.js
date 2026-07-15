// Vision-ready detection model.
//
// This module defines the shape a real object/scene detector would fill in
// (see DetectionResult below) and ships a heuristic stub that approximates
// it using only client-side color/region analysis — no network calls, no
// real object recognition. Swap `detectStub` for a real vision call later
// without touching any downstream code (stickers, palette, frame texture),
// since they all consume the same DetectionResult shape.
//
// DetectionResult:
// {
//   objects: [{ name, category, confidence, region: {x,y,w,h} (0-1 fractions) }],
//   activity: string | null,
//   setting: 'indoor' | 'outdoor' | null,
//   mood: string,               // visual brightness/energy descriptor
//   subjectZone: {x,y,w,h},     // best-guess "don't cover this" region (faces/subject proxy)
//   peopleCountGuess: number | null,
// }

import { analyzeImage } from './analyzeImage'

const CONFIDENCE = {
  HIGH: 0.8,
  MEDIUM: 0.55,
}

// Maps a scene category to a plausible coarse object guess with a modest
// confidence — this is a stand-in for real detection, calibrated to stay
// below the HIGH threshold (0.8) since we can't actually verify specifics.
const SCENE_OBJECT_GUESSES = {
  nature: [{ name: 'tree', category: 'plant', confidence: 0.62 }],
  wall: [{ name: 'wall', category: 'architecture', confidence: 0.7 }],
  cafe: [{ name: 'table', category: 'furniture', confidence: 0.6 }],
  birthday: [{ name: 'cake', category: 'food', confidence: 0.58 }],
  landscape: [{ name: 'sky', category: 'nature', confidence: 0.75 }],
  pet: [{ name: 'animal', category: 'pet', confidence: 0.5 }],
  blurry: [],
  generic: [],
}

const SCENE_SETTING = {
  nature: 'outdoor',
  wall: null,
  cafe: 'indoor',
  birthday: 'indoor',
  landscape: 'outdoor',
  pet: null,
  blurry: null,
  generic: null,
}

const SCENE_ACTIVITY = {
  nature: 'being outdoors',
  wall: 'posing',
  cafe: 'sitting together',
  birthday: 'celebrating',
  landscape: 'looking at a view',
  pet: null,
  blurry: null,
  generic: null,
}

export function detectStub(imgEl) {
  const analysis = analyzeImage(imgEl)
  const { scene, mood, avgL } = analysis

  const objects = SCENE_OBJECT_GUESSES[scene] || []

  // Subject-zone proxy: assume the visual "subject" sits in the center 60%
  // of the frame, since we have no real face/person detection. Downstream
  // sticker placement treats this as a no-cover zone.
  const subjectZone = { x: 0.2, y: 0.15, w: 0.6, h: 0.65 }

  return {
    analysis,
    objects,
    activity: SCENE_ACTIVITY[scene] || null,
    setting: SCENE_SETTING[scene] || null,
    mood,
    brightness: avgL,
    subjectZone,
    peopleCountGuess: null, // not derivable from color alone
    scene,
    source: 'heuristic-stub', // marks this as approximate, not real vision
  }
}

export function confidenceTier(confidence) {
  if (confidence >= CONFIDENCE.HIGH) return 'exact'
  if (confidence >= CONFIDENCE.MEDIUM) return 'category'
  return 'none'
}

export { CONFIDENCE }
