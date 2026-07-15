// Mood catalog: each mood has a color palette (for frame theming),
// a set of quotes, and a curated sticker selection (see stickers.js for shapes).

export const MOODS = {
  joyful: {
    label: 'Joyful',
    emoji: '☀️',
    palette: ['#FFB703', '#FB8500', '#FFD166', '#EF476F'],
    quotes: [
      "Sunshine looks good on you.",
      "Collecting moments like this one.",
      "Happiness, captured.",
      "Good vibes only.",
      "Life is better when you're laughing.",
    ],
    stickers: ['sun', 'star', 'sparkle', 'balloon'],
  },
  calm: {
    label: 'Calm',
    emoji: '🌊',
    palette: ['#219EBC', '#8ECAE6', '#023047', '#A8DADC'],
    quotes: [
      "Breathe in the quiet.",
      "Stillness has its own kind of magic.",
      "Some moments just ask you to slow down.",
      "Peace looks like this.",
      "Calm seas, clear mind.",
    ],
    stickers: ['wave', 'leaf', 'moon', 'droplet'],
  },
  cozy: {
    label: 'Cozy',
    emoji: '🍂',
    palette: ['#B08968', '#DDA15E', '#BC6C25', '#7F4F24'],
    quotes: [
      "Warm light, warmer memories.",
      "Home is a feeling, not a place.",
      "Slow mornings and soft edges.",
      "Comfort found here.",
      "This is what cozy looks like.",
    ],
    stickers: ['leaf', 'mug', 'heart', 'star'],
  },
  dreamy: {
    label: 'Dreamy',
    emoji: '🌸',
    palette: ['#FFC8DD', '#CDB4DB', '#FFAFCC', '#BDE0FE'],
    quotes: [
      "Soft light, softer heart.",
      "Living in pastel and daydream.",
      "A little bit of wonder, always.",
      "Pretty things and quiet joy.",
      "Somewhere between a dream and today.",
    ],
    stickers: ['sparkle', 'heart', 'flower', 'star'],
  },
  moody: {
    label: 'Moody',
    emoji: '🌙',
    palette: ['#22223B', '#4A4E69', '#9A8C98', '#3D405B'],
    quotes: [
      "Beauty in the shadows.",
      "Not every moment needs sunlight.",
      "Depth over brightness.",
      "There's a story in this darkness.",
      "Moody, not sad.",
    ],
    stickers: ['moon', 'star', 'droplet', 'sparkle'],
  },
  wild: {
    label: 'Wild',
    emoji: '🌿',
    palette: ['#606C38', '#283618', '#BC6C25', '#DDA15E'],
    quotes: [
      "Wild things, wild hearts.",
      "Out here, everything feels bigger.",
      "Adventure suits you.",
      "Nature doesn't ask permission.",
      "Untamed and unforgettable.",
    ],
    stickers: ['leaf', 'sun', 'wave', 'flower'],
  },
  romantic: {
    label: 'Romantic',
    emoji: '💗',
    palette: ['#FF8FA3', '#FFB3C6', '#C9184A', '#FFCCD5'],
    quotes: [
      "Soft focus, softer heart.",
      "This one's a keeper.",
      "Sweetness, in frame.",
      "A little love goes a long way.",
      "Blush-colored and unbothered.",
    ],
    stickers: ['heart', 'ribbon', 'sparkle', 'flower'],
  },
  beach: {
    label: 'Beach',
    emoji: '🏖️',
    palette: ['#00B4D8', '#90E0EF', '#FFD166', '#F4A261'],
    quotes: [
      "Salt in the air, sand in the frame.",
      "Tide's out, mood's up.",
      "Sun-warmed and unhurried.",
      "Horizon looked good so we stayed.",
      "Coastal and unbothered.",
    ],
    stickers: ['wave', 'sun', 'droplet', 'umbrella'],
  },
  urban: {
    label: 'Urban Night',
    emoji: '🌃',
    palette: ['#7209B7', '#3A0CA3', '#F72585', '#4CC9F0'],
    quotes: [
      "City lights, longer nights.",
      "Neon looks good on everyone.",
      "After dark and in frame.",
      "The skyline was doing the most.",
      "Glow-up, literally.",
    ],
    stickers: ['flash', 'sparkle', 'moon', 'lightning'],
  },
}

export const MOOD_KEYS = Object.keys(MOODS)

export function randomQuote(moodKey) {
  const mood = MOODS[moodKey]
  const list = mood.quotes
  return list[Math.floor(Math.random() * list.length)]
}
