import type { OpeningHours } from '../data/types'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Parse "HH:MM" into total minutes since midnight */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** Format minutes-since-midnight back to "H:MMam/pm" */
function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 || 12
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`
}

export interface OpenStatus {
  open: boolean
  label: string        // e.g. "Open · closes 10pm" | "Closed · opens 12pm" | "Closed today"
  short: string        // e.g. "Open" | "Closed"
}

export function getOpenStatus(hours: OpeningHours[] | undefined): OpenStatus | null {
  if (!hours || hours.length === 0) return null

  const now = new Date()
  const dayName = DAY_NAMES[now.getDay()]
  const todayHours = hours.find((h) => h.day === dayName)

  if (!todayHours || todayHours.open === 'Closed' || !todayHours.open) {
    return { open: false, label: 'Closed today', short: 'Closed' }
  }

  const currentMins = now.getHours() * 60 + now.getMinutes()
  const openMins = toMinutes(todayHours.open)
  const closeMins = toMinutes(todayHours.close)

  if (currentMins < openMins) {
    return {
      open: false,
      label: `Closed · opens ${formatTime(todayHours.open)}`,
      short: 'Closed',
    }
  }

  if (currentMins < closeMins) {
    return {
      open: true,
      label: `Open · closes ${formatTime(todayHours.close)}`,
      short: 'Open',
    }
  }

  // Closed for today — find next open day
  for (let offset = 1; offset <= 7; offset++) {
    const nextDay = DAY_NAMES[(now.getDay() + offset) % 7]
    const nextHours = hours.find((h) => h.day === nextDay)
    if (nextHours && nextHours.open !== 'Closed' && nextHours.open) {
      const dayLabel = offset === 1 ? 'tomorrow' : nextDay
      return {
        open: false,
        label: `Closed · opens ${dayLabel} ${formatTime(nextHours.open)}`,
        short: 'Closed',
      }
    }
  }

  return { open: false, label: 'Closed', short: 'Closed' }
}
