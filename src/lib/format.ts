export function priceLevel(level: number): string {
  return '£'.repeat(level)
}

export function formatPrice(n: number): string {
  const s = n.toFixed(2)
  return '£' + (s.endsWith('.00') ? s.slice(0, -3) : s)
}

export function ratingLabel(r: number): string {
  if (r >= 4.6) return 'Exceptional'
  if (r >= 4.2) return 'Excellent'
  if (r >= 3.8) return 'Very good'
  if (r >= 3.2) return 'Good'
  if (r >= 2.5) return 'Average'
  return 'Poor'
}

export function pluralise(n: number, word: string, plural?: string): string {
  if (n === 1) return `${n} ${word}`
  return `${n.toLocaleString('en-GB')} ${plural ?? word + 's'}`
}

export function discountPct(original: number, deal: number): number {
  return Math.round((1 - deal / original) * 100)
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
