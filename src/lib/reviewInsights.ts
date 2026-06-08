/**
 * Lightweight, dependency-free review analysis for the merchant dashboard.
 * Pulls recurring aspect themes out of review text (split by sentiment using
 * the star rating) and builds a rating trend. Works on whatever reviews are
 * loaded — no backend call needed.
 */
import type { Review } from '../data/types'

const ASPECTS: { aspect: string; words: string[] }[] = [
  { aspect: 'food', words: ['food', 'dish', 'meal', 'menu', 'flavour', 'flavor', 'tasty', 'delicious', 'cooked', 'plate'] },
  { aspect: 'coffee', words: ['coffee', 'latte', 'espresso', 'flat white', 'cappuccino', 'brew', 'roast'] },
  { aspect: 'service', words: ['service', 'staff', 'waiter', 'waitress', 'server', 'friendly', 'attentive', 'rude', 'welcoming'] },
  { aspect: 'atmosphere', words: ['atmosphere', 'ambience', 'ambiance', 'vibe', 'decor', 'cosy', 'cozy', 'music', 'setting', 'buzz'] },
  { aspect: 'value', words: ['value', 'price', 'expensive', 'cheap', 'overpriced', 'worth', 'pricey', 'bargain', 'reasonable'] },
  { aspect: 'wait times', words: ['wait', 'waiting', 'slow', 'queue', 'delay', 'ages', 'quick', 'prompt'] },
  { aspect: 'portions', words: ['portion', 'generous', 'filling', 'tiny', 'huge', 'hearty'] },
  { aspect: 'cleanliness', words: ['clean', 'dirty', 'hygiene', 'spotless', 'tidy', 'grubby'] },
  { aspect: 'drinks', words: ['drink', 'cocktail', 'wine', 'beer', 'pint', 'bar'] },
  { aspect: 'parking', words: ['parking', 'car park'] },
]

export interface ReviewInsights {
  total: number
  loved: { aspect: string; count: number }[]
  watch: { aspect: string; count: number }[]
  trend: { label: string; avg: number; count: number }[]
}

export function analyzeReviews(reviews: Review[]): ReviewInsights {
  const loved: Record<string, number> = {}
  const watch: Record<string, number> = {}

  for (const r of reviews) {
    const text = `${r.title ?? ''} ${r.body ?? ''}`.toLowerCase()
    if (!text.trim()) continue
    for (const { aspect, words } of ASPECTS) {
      if (words.some((w) => text.includes(w))) {
        if (r.rating >= 4) loved[aspect] = (loved[aspect] ?? 0) + 1
        else if (r.rating <= 3) watch[aspect] = (watch[aspect] ?? 0) + 1
      }
    }
  }

  const top = (m: Record<string, number>) =>
    Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([aspect, count]) => ({ aspect, count }))

  // Rating trend by month — best-effort (skips reviews with unparseable dates)
  const byMonth: Record<string, { sum: number; n: number; t: number }> = {}
  for (const r of reviews) {
    const d = new Date(r.date)
    if (isNaN(d.getTime())) continue
    const key = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
    byMonth[key] ??= { sum: 0, n: 0, t: d.getTime() }
    byMonth[key].sum += r.rating
    byMonth[key].n += 1
  }
  const trend = Object.entries(byMonth)
    .sort((a, b) => a[1].t - b[1].t)
    .slice(-6)
    .map(([label, v]) => ({ label, avg: v.sum / v.n, count: v.n }))

  return { total: reviews.length, loved: top(loved), watch: top(watch), trend }
}
