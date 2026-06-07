import { useState } from 'react'
import clsx from 'clsx'
import { initials } from '../lib/format'

interface Props {
  name: string
  src?: string
  size?: number
  className?: string
}

const BG = [
  'bg-rose-200 text-rose-800',
  'bg-amber-200 text-amber-800',
  'bg-emerald-200 text-emerald-800',
  'bg-sky-200 text-sky-800',
  'bg-violet-200 text-violet-800',
  'bg-orange-200 text-orange-800',
]

export default function Avatar({ name, src, size = 40, className }: Props) {
  const [failed, setFailed] = useState(false)
  const bg = BG[name.charCodeAt(0) % BG.length]

  if (!src || failed) {
    return (
      <span
        className={clsx(
          'inline-flex items-center justify-center rounded-full font-semibold select-none',
          bg,
          className,
        )}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials(name)}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className={clsx('rounded-full bg-stone-100 object-cover', className)}
      style={{ width: size, height: size }}
    />
  )
}
