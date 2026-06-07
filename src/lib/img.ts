// Image helpers for the prototype.
//
// Primary source is loremflickr, which returns keyword-matched photographs and
// is deterministic when given a `lock` seed. If a photo fails to load,
// <SmartImage> swaps in the gradient placeholder below, so the UI never shows a
// broken-image icon. Swapping the whole image strategy is a one-line change here.

export function img(
  keywords: string,
  seed: string | number,
  w = 800,
  h = 600,
): string {
  const kw = encodeURIComponent(keywords)
  return `https://loremflickr.com/${w}/${h}/${kw}?lock=${seed}`
}

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/** A tasteful deterministic gradient + emoji, used as an offline fallback. */
export function placeholderDataUri(seed: string, emoji = '🍽️'): string {
  const h1 = hash(seed) % 360
  const h2 = (h1 + 40) % 360
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${h1} 65% 62%)"/>
      <stop offset="1" stop-color="hsl(${h2} 70% 48%)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <text x="400" y="330" font-size="190" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
