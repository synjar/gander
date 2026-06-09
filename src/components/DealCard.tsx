import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import clsx from 'clsx'
import type { Deal } from '../data/types'
import { businessesById } from '../data/businesses'
import { categoryMap } from '../data/categories'
import { discountPct, formatPrice } from '../lib/format'
import { useStore } from '../store/StoreContext'
import SmartImage from './SmartImage'

interface Props {
  deal: Deal
  className?: string
}

export default function DealCard({ deal, className }: Props) {
  const { liveBusinesses, importedBusinesses } = useStore()
  // Resolve the venue across seed, live (approved) and imported businesses so
  // deals on claimed/imported venues still show their name and category.
  const biz =
    businessesById[deal.businessId] ??
    liveBusinesses.find((b) => b.id === deal.businessId) ??
    importedBusinesses.find((b) => b.id === deal.businessId)
  const emoji = biz ? categoryMap[biz.category].emoji : '🎟️'
  const pct = discountPct(deal.originalPrice, deal.dealPrice)

  return (
    <Link
      to={`/deals/${deal.id}`}
      className={clsx(
        'group flex flex-col overflow-hidden rounded-2xl bg-white card-shadow ring-1 ring-stone-100 transition hover:-translate-y-0.5 hover:shadow-lg',
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <SmartImage
          src={deal.image}
          seedFallback={deal.id}
          emoji={emoji}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-2 top-2 rounded-full bg-brand-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
          -{pct}%
        </span>
        {deal.tag && (
          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-stone-700 shadow-sm backdrop-blur">
            {deal.tag}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-xs font-medium text-stone-500">
          {biz?.name}
          {biz && (
            <span className="ml-1 inline-flex items-center gap-0.5 text-stone-400">
              <MapPin size={11} /> {biz.neighbourhood}
            </span>
          )}
        </p>
        <h3 className="mt-1 line-clamp-2 font-semibold leading-snug text-stone-900 group-hover:text-brand-600">
          {deal.title}
        </h3>

        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <span className="text-lg font-bold text-brand-600">
              {formatPrice(deal.dealPrice)}
            </span>
            <span className="ml-1.5 text-sm text-stone-400 line-through">
              {formatPrice(deal.originalPrice)}
            </span>
          </div>
          <span className="text-xs text-stone-400">
            {deal.sold.toLocaleString('en-GB')} bought
          </span>
        </div>
      </div>
    </Link>
  )
}
