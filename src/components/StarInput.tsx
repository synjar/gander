import { useState } from 'react'
import { Star } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  value: number
  onChange: (n: number) => void
  size?: number
}

export default function StarInput({ value, onChange, size = 30 }: Props) {
  const [hover, setHover] = useState(0)
  const active = hover || value

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className="transition active:scale-90"
        >
          <Star
            size={size}
            strokeWidth={0}
            fill="currentColor"
            className={clsx(n <= active ? 'text-amber-400' : 'text-stone-200')}
          />
        </button>
      ))}
    </div>
  )
}
