import { Link } from 'react-router-dom'
import { MapPin, Tag } from 'lucide-react'
import clsx from 'clsx'
import type { Business } from '../data/types'
import { categoryMap } from '../data/categories'
import { dealsForBusiness } from '../data/deals'
import { priceLevel } from '../lib/format'
import { useStore } from '../store/StoreContext'
import SmartImage from './SmartImage'
import Stars from './Stars'
import FavouriteButton from './FavouriteButton'

interface Props {
  business: Business
  className?: string
  showRank?: boolean
}

export default function BusinessCard({ business: b, className, showRank }: Props) {
  const { statsFor } = useStore()
  const { rating, reviewCount } = statsFor(b)
  const emoji = categoryMap[b.category].emoji
  const hasDeal = dealsForBusiness(b.id).length > 0

  return (
    <Link
      to={`/b/${b.slug}`}
      className={clsx(
        'group flex flex-col overflow-hidden rounded-2xl bg-white card-shadow ring-1 ring-stone-100 transition hover:-translate-y-0.5 hover:shadow-lg',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <SmartImage
          src={b.heroImage}
          seedFallback={b.id}
          emoji={emoji}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute right-2 top-2">
          <FavouriteButton id={b.id} />
        </div>
        {showRank && b.rank && (
          <span className="absolute left-2 top-2 rounded-full bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
            #{b.rank} Must-Eat
          </span>
        )}
        {hasDeal && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white shadow-sm">
            <Tag size={12} /> Deal
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight text-stone-900 group-hover:text-brand-600">
            {b.name}
          </h3>
          <span className="shrink-0 text-sm font-medium text-stone-500">
            {priceLevel(b.priceLevel)}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-1.5">
          <Stars value={rating} size={15} />
          <span className="text-sm font-semibold text-stone-800">{rating.toFixed(1)}</span>
          <span className="text-xs text-stone-400">({reviewCount.toLocaleString('en-GB')})</span>
        </div>

        <p className="mt-1 text-sm text-stone-500">
          {b.cuisine}
          <span className="mx-1.5 text-stone-300">·</span>
          <span className="inline-flex items-center gap-0.5">
            <MapPin size={13} className="text-stone-400" />
            {b.neighbourhood}
          </span>
        </p>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {b.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}
