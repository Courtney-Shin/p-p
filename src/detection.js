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
import { detectObjects } from './objectDetection'

const CONFIDENCE = {
  HIGH: 0.8,
  MEDIUM: 0.55,
}

// Maps DETR's COCO-80 labels to this app's scene keys. Only listed when a
// detected object is a strong, near-unambiguous signal for that scene —
// e.g. "cake" almost certainly means birthday/celebration context, but
// "chair" is too generic to force a scene on its own.
// DETR/COCO labels are space-separated lowercase strings (e.g. "dining
// table", "wine glass") — not underscored — per the model's id2label map.
const COCO_LABEL_TO_SCENE = {
  cake: 'birthday',
  dog: 'pet',
  cat: 'pet',
  bird: 'pet',
  'dining table': 'cafe',
  cup: 'cafe',
  'wine glass': 'cafe',
  umbrella: 'street',
}

const COCO_LABEL_TO_CATEGORY = {
  person: 'person',
  dog: 'pet',
  cat: 'pet',
  bird: 'pet',
  cake: 'food',
  cup: 'food',
  'wine glass': 'food',
  bottle: 'food',
  'dining table': 'furniture',
  chair: 'furniture',
  couch: 'furniture',
  umbrella: 'accessory',
  backpack: 'accessory',
  handbag: 'accessory',
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

// Real detection path: runs DETR object detection and produces the same
// DetectionResult shape as detectStub, so every downstream consumer
// (scene selection, sticker rules, subject-avoidance placement) works
// unmodified regardless of which detector produced the result. Falls back
// to the color-heuristic stub's scene/mood fields for anything DETR can't
// tell us (DETR finds objects; it has no idea if a photo is "moody").
export async function detectReal(imgEl, { onProgress } = {}) {
  const analysis = analyzeImage(imgEl)
  const detections = await detectObjects(imgEl, { threshold: 0.6, onProgress })

  const objects = detections.map((d) => ({
    name: d.label,
    category: COCO_LABEL_TO_CATEGORY[d.label] || 'other',
    confidence: d.confidence,
    region: d.box,
  }))

  const peopleCountGuess = detections.filter((d) => d.label === 'person').length || null

  // Prefer a scene implied by a high-confidence detected object (e.g. a
  // cake really does mean "birthday") over the color-heuristic guess;
  // otherwise keep the heuristic scene as-is.
  let scene = analysis.scene
  const sceneOverride = detections
    .filter((d) => COCO_LABEL_TO_SCENE[d.label] && d.confidence >= CONFIDENCE.MEDIUM)
    .sort((a, b) => b.confidence - a.confidence)[0]
  if (sceneOverride) scene = COCO_LABEL_TO_SCENE[sceneOverride.label]

  // Subject zone: union of detected person boxes if any people were found,
  // otherwise fall back to the center-frame proxy used by the stub.
  const personBoxes = detections.filter((d) => d.label === 'person').map((d) => d.box)
  const subjectZone = personBoxes.length > 0 ? unionBoxes(personBoxes) : { x: 0.2, y: 0.15, w: 0.6, h: 0.65 }

  return {
    analysis,
    objects,
    activity: SCENE_ACTIVITY[scene] || null,
    setting: SCENE_SETTING[scene] || null,
    mood: analysis.mood,
    brightness: analysis.avgL,
    subjectZone,
    peopleCountGuess,
    scene,
    source: 'detr-resnet-50', // marks this as a real model result, not a guess
  }
}

function unionBoxes(boxes) {
  const x = Math.min(...boxes.map((b) => b.x))
  const y = Math.min(...boxes.map((b) => b.y))
  const right = Math.max(...boxes.map((b) => b.x + b.w))
  const bottom = Math.max(...boxes.map((b) => b.y + b.h))
  return { x, y, w: right - x, h: bottom - y }
}

export function confidenceTier(confidence) {
  if (confidence >= CONFIDENCE.HIGH) return 'exact'
  if (confidence >= CONFIDENCE.MEDIUM) return 'category'
  return 'none'
}

export { CONFIDENCE }
