/** XP values awarded for each user action */
export const XP = {
  REVIEW: 50,
  BOOKING: 20,
  CHECKIN: 10,
  DEAL: 15,
  REFERRAL: 100,
} as const

export const LEVELS = [
  { level: 1, name: 'Foodie',      min: 0 },
  { level: 2, name: 'Explorer',    min: 100 },
  { level: 3, name: 'Gourmet',     min: 300 },
  { level: 4, name: 'Connoisseur', min: 700 },
  { level: 5, name: 'Legend',      min: 1500 },
] as const

export function getLevel(points: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) return LEVELS[i].level
  }
  return 1
}

export function getLevelName(level: number): string {
  return LEVELS.find((l) => l.level === level)?.name ?? 'Foodie'
}

export function getLevelProgress(points: number): {
  progress: number
  toNext: number
  nextLevel: number
  nextLevelName: string
} {
  const currentLevel = getLevel(points)
  if (currentLevel >= 5) return { progress: 100, toNext: 0, nextLevel: 5, nextLevelName: 'Legend' }
  const currentMin = LEVELS[currentLevel - 1].min
  const nextEntry = LEVELS[currentLevel]
  const progress = ((points - currentMin) / (nextEntry.min - currentMin)) * 100
  return {
    progress: Math.min(Math.max(progress, 0), 100),
    toNext: nextEntry.min - points,
    nextLevel: nextEntry.level,
    nextLevelName: nextEntry.name,
  }
}

/** Referral code is the first 8 hex chars of the user's UUID (deterministic, no extra storage) */
export function getReferralCode(userId: string): string {
  return userId.replace(/-/g, '').slice(0, 8).toUpperCase()
}

/** Haversine distance in km between two lat/lng points */
export function distanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)} km`
}
