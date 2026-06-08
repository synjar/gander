import clsx from 'clsx'
import { getLevelName } from '../lib/xp'

// Distinct visual style per level
const LEVEL_STYLES: Record<number, string> = {
  1: 'bg-stone-100 text-stone-600 ring-stone-200',                    // Foodie — grey
  2: 'bg-emerald-50 text-emerald-700 ring-emerald-200',               // Explorer — green
  3: 'bg-sky-50 text-sky-700 ring-sky-200',                           // Gourmet — blue
  4: 'bg-violet-50 text-violet-700 ring-violet-200',                  // Connoisseur — purple
  5: 'bg-amber-50 text-amber-700 ring-amber-300 shadow-amber-100',    // Legend — gold
}

const LEVEL_EMOJI: Record<number, string> = {
  1: '🍴',
  2: '🗺️',
  3: '👨‍🍳',
  4: '🏅',
  5: '⭐',
}

export default function LevelBadge({
  level,
  showName = false,
  className,
}: {
  level: number
  /** Show the level name (Foodie, Explorer…) instead of just the number */
  showName?: boolean
  className?: string
}) {
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES[1]
  const emoji = LEVEL_EMOJI[level] ?? '🍴'
  const name = getLevelName(level)

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-wide ring-1',
        level === 5 && 'shadow-sm',
        style,
        className,
      )}
      title={`${name} · Level ${level}`}
    >
      <span aria-hidden>{emoji}</span>
      {showName ? name : `Lv ${level}`}
    </span>
  )
}
