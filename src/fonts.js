// Caption font pool: a mix of self-hosted files (in src/assets/fonts) and
// Google Fonts (loaded via <link> in index.html), all free for commercial
// use. One is picked at random per decoration so captions don't always look
// the same. To add another self-hosted font later: drop the file in
// src/assets/fonts, add an @font-face in index.css, then add an entry here
// with source: 'local'. Google Fonts entries just need the family name to
// already be linked in index.html.

export const CAPTION_FONTS = {
  en: [
    { id: 'bunny', family: 'BunnyCaption', fallback: 'Georgia, serif', source: 'local' },
    { id: 'caveat', family: 'Caveat', fallback: 'cursive', source: 'google', weight: 600 },
    { id: 'patrick', family: 'Patrick Hand', fallback: 'cursive', source: 'google' },
    { id: 'kalam', family: 'Kalam', fallback: 'cursive', source: 'google', weight: 500 },
  ],
  ko: [
    { id: 'nanum', family: 'NanumHandwriting', fallback: '"Apple SD Gothic Neo", sans-serif', source: 'local' },
    { id: 'gaegu', family: 'Gaegu', fallback: '"Apple SD Gothic Neo", sans-serif', source: 'google' },
    { id: 'gamja', family: 'Gamja Flower', fallback: '"Apple SD Gothic Neo", sans-serif', source: 'google' },
    { id: 'jua', family: 'Jua', fallback: '"Apple SD Gothic Neo", sans-serif', source: 'google' },
  ],
}

export function randomFont(lang) {
  const pool = CAPTION_FONTS[lang] || CAPTION_FONTS.en
  return pool[Math.floor(Math.random() * pool.length)]
}

export function fontCssValue(font, sizePx) {
  const weight = font.weight ? `${font.weight} ` : ''
  return `${weight}${sizePx}px "${font.family}", ${font.fallback}`
}
