/**
 * Profile-strength score for a business listing. Pure + synchronous — drives the
 * "complete your listing" nudge in the merchant dashboard. Fuller listings get
 * meaningfully more views, so this doubles as a growth lever.
 */
import type { Business } from '../data/types'

export interface StrengthItem {
  label: string
  done: boolean
}

export interface ProfileStrength {
  score: number // 0–100
  done: number
  total: number
  items: StrengthItem[]
}

const FOOD = ['restaurants', 'cafes', 'bars', 'pubs']

export function profileStrength(b: Business): ProfileStrength {
  const items: StrengthItem[] = [
    { label: 'Hero photo', done: Boolean(b.heroImage) },
    { label: '3+ gallery photos', done: (b.images?.length ?? 0) >= 3 },
    { label: 'Full description', done: (b.description?.length ?? 0) >= 120 },
    { label: 'Phone number', done: Boolean(b.phone) },
    { label: 'Website', done: Boolean(b.website) },
    { label: 'Opening hours', done: (b.hours?.length ?? 0) > 0 },
    { label: '3+ amenities', done: (b.amenities?.length ?? 0) >= 3 },
  ]
  if (FOOD.includes(b.category)) {
    items.push({ label: 'Popular dishes', done: (b.popularDishes?.length ?? 0) > 0 })
  }
  const done = items.filter((i) => i.done).length
  return { score: Math.round((done / items.length) * 100), done, total: items.length, items }
}
