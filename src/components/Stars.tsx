import { Star } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  value: number
  size?: number
  className?: string
}

export default function Stars({ value, size = 16, className }: Props) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100))
  return (
    <span
      className={clsx('relative inline-flex shrink-0', className)}
      style={{ width: size * 5 + 2 * 4, height: size }}
      aria-label={`${value} out of 5 stars`}
      role="img"
    >
      <span className="absolute inset-0 flex gap-px">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={size} className="shrink-0 text-stone-300" fill="currentColor" strokeWidth={0} />
        ))}
      </span>
      <span className="absolute inset-0 flex gap-px overflow-hidden" style={{ width: `${pct}%` }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={size} className="shrink-0 text-amber-400" fill="currentColor" strokeWidth={0} />
        ))}
      </span>
    </span>
  )
}
