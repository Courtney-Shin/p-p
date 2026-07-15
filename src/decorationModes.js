// Decoration mode presets (§17): bundle sticker count bias, frame texture,
// and caption category weighting into one selectable starting point. Modes
// are presets, not locks — every control they set remains editable after
// picking one.

export const DECORATION_MODES = {
  clean: {
    label: 'Clean',
    description: '1–3 stickers, flat frame, minimal grain, one accent, short dry caption.',
    stickerCountBias: 'low', // fewer than the scene's default range
    frameTexture: 'solid',
    photoOverlay: 'none',
    captionWeights: { deadpan: 55, supportingCast: 30, selfAware: 10, online: 5 },
  },
  scrapbook: {
    label: 'Scrapbook',
    description: '3–6 stickers, layered textures, supporting-object caption.',
    stickerCountBias: 'high',
    frameTexture: 'dots',
    photoOverlay: 'none',
    captionWeights: { deadpan: 25, supportingCast: 50, selfAware: 15, online: 10 },
  },
  glossy: {
    label: 'Glossy',
    description: 'Puffy stickers, bright accents, flash highlights, online caption style.',
    stickerCountBias: 'high',
    frameTexture: 'glossy',
    photoOverlay: 'glossy',
    captionWeights: { deadpan: 20, supportingCast: 30, selfAware: 15, online: 35 },
  },
  deadpan: {
    label: 'Deadpan',
    description: 'Very little decoration, one strangely specific sticker, system/literal caption.',
    stickerCountBias: 'minimal',
    frameTexture: 'faded',
    photoOverlay: 'grain',
    captionWeights: { deadpan: 45, supportingCast: 10, selfAware: 40, online: 5 },
  },
}

export const DECORATION_MODE_KEYS = Object.keys(DECORATION_MODES)

const BIAS_MULTIPLIER = {
  minimal: 0.4,
  low: 0.7,
  high: 1.3,
}

// Applies a mode's sticker-count bias to a [min, max] range from
// stickerRules.js, keeping at least 1 as the floor.
export function applyStickerCountBias([min, max], bias) {
  const mult = BIAS_MULTIPLIER[bias] ?? 1
  const newMax = Math.max(1, Math.round(max * mult))
  const newMin = Math.max(bias === 'minimal' ? 1 : min, Math.min(newMax, Math.round(min * mult)))
  return [Math.min(newMin, newMax), newMax]
}
