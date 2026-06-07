import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface SectionProps {
  title: string
  subtitle?: string
  seeAllTo?: string
  seeAllLabel?: string
  children: ReactNode
  className?: string
}

export function Section({
  title,
  subtitle,
  seeAllTo,
  seeAllLabel = 'See all',
  children,
  className,
}: SectionProps) {
  return (
    <section className={clsx('mx-auto max-w-7xl px-4 py-6', className)}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-stone-900">
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}
        </div>
        {seeAllTo && (
          <Link
            to={seeAllTo}
            className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {seeAllLabel}
            <ChevronRight size={16} />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

export function Carousel({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 no-scrollbar">
      {children}
    </div>
  )
}
