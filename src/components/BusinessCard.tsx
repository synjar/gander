import { Link } from 'react-router-dom'
import { MapPin, Tag, Ticket } from 'lucide-react'
import clsx from 'clsx'
import type { Business } from '../data/types'
import { categoryMap } from '../data/categories'
import { dealsForBusiness } from '../data/deals'
import { priceLevel } from '../lib/format'
import { getOpenStatus } from '../lib/hours'
import { useStore } from '../store/StoreContext'
import SmartImage from './SmartImage'
import Stars from './Stars'
import FavouriteButton from './FavouriteButton'

interface Props {
  business: Business
  className?: string
  showRank?: boolean
  distance?: string
  /** When the card is shown in search results, the query that surfaced it —
   *  carried to the listing page so the view can be attributed to this search. */
  searchQuery?: string
}

export default function BusinessCard({ business: b, className, showRank, distance, searchQuery }: Props) {
  const { statsFor } = useStore()
  const { rating, reviewCount } = statsFor(b)
  const to = searchQuery?.trim()
    ? `/b/${b.slug}?q=${encodeURIComponent(searchQuery.trim())}`
    : `/b/${b.slug}`
  const emoji = categoryMap[b.category].emoji
  const hasDeal = dealsForBusiness(b.id).length > 0
  const openStatus = getOpenStatus(b.hours)
  // Attractions are council-owned, not claimable — different card entirely
  const isAttraction = b.category === 'attractions'
  // Unclaimed = OSM-imported business that hasn't been claimed yet (not an attraction)
  const isUnclaimed = b.source === 'osm' && !b.claimed && !isAttraction

  if (isAttraction) {
    // ── Attraction card (parks, piers, museums, landmarks) ──────────────────────
    return (
      <Link
        to={to}
        className={clsx(
          'group flex flex-col overflow-hidden rounded-2xl bg-white card-shadow ring-1 ring-teal-100 transition hover:-translate-y-0.5 hover:shadow-lg',
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
          {/* Attraction type badge */}
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-teal-600/90 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-sm">
            {emoji} {b.cuisine || 'Attraction'}
          </span>
          {/* Free/paid entry badge */}
          {b.freeEntry && (
            <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-[11px] font-semibold text-white shadow-sm">
              <Ticket size={11} /> Free entry
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3.5">
          <h3 className="font-semibold leading-tight text-stone-900 group-hover:text-teal-700">
            {b.name}
          </h3>

          {reviewCount > 0 ? (
            <div className="mt-1.5 flex items-center gap-1.5">
              <Stars value={rating} size={15} />
              <span className="text-sm font-semibold text-stone-800">{rating.toFixed(1)}</span>
              <span className="text-xs text-stone-400">({reviewCount.toLocaleString('en-GB')})</span>
            </div>
          ) : (
            <p className="mt-1 text-xs text-stone-400">No reviews yet</p>
          )}

          <p className="mt-1 text-sm text-stone-500">
            <span className="inline-flex items-center gap-0.5">
              <MapPin size={13} className="text-stone-400" />
              {b.neighbourhood}
            </span>
            {distance && (
              <>
                <span className="mx-1.5 text-stone-300">·</span>
                <span className="font-medium text-teal-600">{distance}</span>
              </>
            )}
          </p>

          {b.tags.filter((t) => t !== 'Free entry' && t !== 'Admission charged').slice(0, 2).length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {b.tags.filter((t) => t !== 'Free entry' && t !== 'Admission charged').slice(0, 2).map((t) => (
                <span key={t} className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    )
  }

  if (isUnclaimed) {
    // ── Unclaimed / basic listing card ────────────────────────────────────────
    return (
      <Link
        to={to}
        className={clsx(
          'group flex flex-col overflow-hidden rounded-2xl border border-dashed border-stone-300 bg-stone-50 transition hover:-translate-y-0.5 hover:border-stone-400 hover:bg-white hover:shadow-md',
          className,
        )}
      >
        {/* Image — desaturated to signal unverified */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <SmartImage
            src={b.heroImage}
            seedFallback={b.id}
            emoji={emoji}
            className="h-full w-full object-cover opacity-80 grayscale-[30%] transition duration-500 group-hover:opacity-100 group-hover:grayscale-0"
          />
          {/* Basic listing badge */}
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-stone-500 shadow-sm ring-1 ring-stone-200 backdrop-blur-sm">
            Basic listing
          </span>
        </div>

        <div className="flex flex-1 flex-col p-3.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight text-stone-700 group-hover:text-brand-600">
              {b.name}
            </h3>
            <span className="shrink-0 text-sm font-medium text-stone-400">
              {priceLevel(b.priceLevel)}
            </span>
          </div>

          <p className="mt-1 text-sm text-stone-400">
            {b.cuisine && <>{b.cuisine}<span className="mx-1.5 text-stone-300">·</span></>}
            <span className="inline-flex items-center gap-0.5">
              <MapPin size={13} className="text-stone-300" />
              {b.neighbourhood}
            </span>
            {distance && (
              <>
                <span className="mx-1.5 text-stone-300">·</span>
                <span className="font-medium text-brand-500">{distance}</span>
              </>
            )}
          </p>

          {reviewCount > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <Stars value={rating} size={13} />
              <span className="text-xs font-semibold text-stone-500">{rating.toFixed(1)}</span>
              <span className="text-xs text-stone-400">({reviewCount})</span>
            </div>
          )}

          {/* Claim prompt */}
          <div className="mt-auto pt-3">
            <span className="text-[11px] font-medium text-brand-500 group-hover:underline">
              Is this your business? Claim it →
            </span>
          </div>
        </div>
      </Link>
    )
  }

  // ── Fully verified / curated card ──────────────────────────────────────────
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
          {distance && (
            <>
              <span className="mx-1.5 text-stone-300">·</span>
              <span className="font-medium text-brand-600">{distance}</span>
            </>
          )}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {openStatus && (
            <span
              className={clsx(
                'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                openStatus.open
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-stone-100 text-stone-500',
              )}
              title={openStatus.label}
            >
              {openStatus.open ? '● Open' : '○ Closed'}
            </span>
          )}
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
