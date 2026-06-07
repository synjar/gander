import clsx from 'clsx'

export default function LevelBadge({
  level,
  className,
}: {
  level: number
  className?: string
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-600 ring-1 ring-brand-100',
        className,
      )}
      title={`Level ${level} reviewer`}
    >
      Lv {level}
    </span>
  )
}
