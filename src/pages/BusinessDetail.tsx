import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Award,
  Bike,
  CalendarCheck,
  Check,
  ChevronRight,
  Globe,
  MapPin,
  Navigation,
  PenLine,
  Phone,
  Share2,
} from 'lucide-react'
import clsx from 'clsx'
import { businessBySlug, businesses } from '../data/businesses'
import { categoryMap } from '../data/categories'
import { priceLevel, formatPrice, ratingLabel, discountPct } from '../lib/format'
import { useStore } from '../store/StoreContext'
import type { Business } from '../data/types'
import SmartImage from '../components/SmartImage'
import Stars from '../components/Stars'
import BusinessCard from '../components/BusinessCard'
import MapView from '../components/MapView'
import ReviewCard from '../components/ReviewCard'
import FavouriteButton from '../components/FavouriteButton'
import ReviewModal from '../components/ReviewModal'
import BookingModal from '../components/BookingModal'
import OrderModal from '../components/OrderModal'

function bookingConfig(b: Business): { label: string; mode: 'table' | 'class' | 'treatment' } {
  switch (b.category) {
    case 'gyms':
      return { label: 'Book a class', mode: 'class' }
    case 'spas':
      return { label: 'Book a treatment', mode: 'treatment' }
    case 'salons':
      return { label: 'Book appointment', mode: 'treatment' }
    case 'hotels':
      return { label: 'Check availability', mode: 'table' }
    default:
      return { label: 'Book a table', mode: 'table' }
  }
}

function Gallery({ b }: { b: Business }) {
  const emoji = categoryMap[b.category].emoji
  const imgs = [b.heroImage, ...b.images].slice(0, 5)
  return (
    <>
      {/* Mobile: scroller */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:hidden">
        {imgs.map((src, i) => (
          <SmartImage
            key={i}
            src={src}
            seedFallback={`${b.id}-${i}`}
            emoji={emoji}
            className="h-56 w-72 shrink-0 rounded-2xl object-cover"
          />
        ))}
      </div>
      {/* Desktop: mosaic */}
      <div className="hidden h-96 grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl md:grid">
        <SmartImage
          src={imgs[0]}
          seedFallback={`${b.id}-0`}
          emoji={emoji}
          className="col-span-2 row-span-2 h-full w-full object-cover"
        />
        {imgs.slice(1, 5).map((src, i) => (
          <SmartImage
            key={i}
            src={src}
            seedFallback={`${b.id}-${i + 1}`}
            emoji={emoji}
            className="h-full w-full object-cover"
          />
        ))}
      </div>
    </>
  )
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-sm text-stone-600">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-stone-100">
        <div className="h-full rounded-full bg-brand-400" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right text-sm font-semibold text-stone-800">
        {value.toFixed(1)}
      </span>
    </div>
  )
}

export default function BusinessDetail() {
  const { slug } = useParams()
  const { statsFor, reviewsFor, dealsForBusinessId, liveBusinesses } = useStore()
  const b = slug
    ? (businessBySlug(slug) ?? liveBusinesses.find((b) => b.slug === slug))
    : undefined
  const [reviewOpen, setReviewOpen] = useState(false)
  const [bookOpen, setBookOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)
  const [toast, setToast] = useState('')

  if (!b) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-stone-900">Place not found</h1>
        <Link to="/" className="mt-4 inline-block text-brand-600 hover:underline">
          Back to Discover
        </Link>
      </div>
    )
  }

  const stats = statsFor(b)
  const reviews = reviewsFor(b.id)
  const bizDeals = dealsForBusinessId(b.id)
  const similar = businesses
    .filter((x) => x.category === b.category && x.id !== b.id)
    .sort((x, y) => y.rating - x.rating)
    .slice(0, 4)
  const cat = categoryMap[b.category]
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long' })
  const booking = bookingConfig(b)

  function showToast(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  async function share() {
    const url = window.location.href
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> }
    if (nav.share) {
      try {
        await nav.share({ title: b!.name, url })
      } catch {
        /* dismissed */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        showToast('Link copied to clipboard')
      } catch {
        showToast('Could not copy link')
      }
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      {/* Breadcrumb */}
      <nav className="mb-3 flex items-center gap-1 text-xs text-stone-400">
        <Link to="/" className="hover:text-stone-600">
          Discover
        </Link>
        <ChevronRight size={12} />
        <Link to={`/search?category=${b.category}`} className="hover:text-stone-600">
          {cat.label}
        </Link>
        <ChevronRight size={12} />
        <span className="text-stone-600">{b.name}</span>
      </nav>

      {/* Title block */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          {b.rank && (
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              <Award size={13} /> #{b.rank} on the Must-Eat List
            </span>
          )}
          <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            {b.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5">
              <Stars value={stats.rating} size={17} />
              <span className="font-semibold text-stone-900">{stats.rating.toFixed(1)}</span>
              <span className="font-medium text-amber-600">{ratingLabel(stats.rating)}</span>
            </span>
            <a href="#reviews" className="text-stone-500 hover:text-brand-600">
              {stats.reviewCount.toLocaleString('en-GB')} reviews
            </a>
            <span className="text-stone-300">·</span>
            <span className="font-medium text-stone-600">{priceLevel(b.priceLevel)}</span>
            <span className="text-stone-300">·</span>
            <span className="text-stone-600">{b.cuisine}</span>
            <span className="text-stone-300">·</span>
            <span className="flex items-center gap-1 text-stone-600">
              <MapPin size={14} className="text-stone-400" />
              {b.neighbourhood}
            </span>
            <span
              className={clsx(
                'rounded-full px-2 py-0.5 text-xs font-semibold',
                b.openNow ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500',
              )}
            >
              {b.openNow ? 'Open now' : 'Closed'}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {b.tags.map((t) => (
              <Link
                key={t}
                to={`/search?q=${encodeURIComponent(t)}`}
                className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600 hover:bg-stone-200"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Gallery b={b} />

      {/* Action bar */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        {b.bookable && (
          <button
            onClick={() => setBookOpen(true)}
            className="flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
          >
            <CalendarCheck size={17} /> {booking.label}
          </button>
        )}
        {b.delivers && (
          <button
            onClick={() => setOrderOpen(true)}
            className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
          >
            <Bike size={17} className="text-emerald-600" /> Order delivery
          </button>
        )}
        <button
          onClick={() => setReviewOpen(true)}
          className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
        >
          <PenLine size={17} className="text-brand-500" /> Write a review
        </button>
        <span className="ml-auto flex items-center gap-1">
          <span className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-1 py-1">
            <FavouriteButton id={b.id} variant="plain" />
          </span>
          <button
            onClick={share}
            aria-label="Share"
            className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50"
          >
            <Share2 size={18} />
          </button>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${b.lat},${b.lng}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Directions"
            className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50"
          >
            <Navigation size={18} />
          </a>
        </span>
      </div>

      {/* Body grid */}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          {/* About */}
          <section>
            <h2 className="font-display text-xl font-semibold text-stone-900">About {b.name}</h2>
            <p className="mt-2 leading-relaxed text-stone-600">{b.description}</p>
          </section>

          {/* Deals */}
          {bizDeals.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold text-stone-900">Deals & vouchers</h2>
              <div className="mt-3 space-y-3">
                {bizDeals.map((d) => (
                  <Link
                    key={d.id}
                    to={`/deals/${d.id}`}
                    className="group flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-3 transition hover:border-brand-200 hover:shadow-sm"
                  >
                    <SmartImage
                      src={d.image}
                      seedFallback={d.id}
                      emoji={cat.emoji}
                      className="h-20 w-24 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-stone-900 group-hover:text-brand-600">{d.title}</p>
                      <p className="line-clamp-1 text-sm text-stone-500">{d.description}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-bold text-brand-600">{formatPrice(d.dealPrice)}</span>
                        <span className="text-sm text-stone-400 line-through">
                          {formatPrice(d.originalPrice)}
                        </span>
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
                          -{discountPct(d.originalPrice, d.dealPrice)}%
                        </span>
                      </div>
                    </div>
                    <span className="hidden shrink-0 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white sm:block">
                      Buy
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Popular dishes */}
          {b.popularDishes && b.popularDishes.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold text-stone-900">Popular dishes</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {b.popularDishes.map((d) => (
                  <div
                    key={d.name}
                    className="flex items-start justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3.5"
                  >
                    <div>
                      <p className="font-medium text-stone-900">{d.name}</p>
                      {d.description && <p className="text-sm text-stone-500">{d.description}</p>}
                    </div>
                    <span className="shrink-0 font-semibold text-stone-700">{formatPrice(d.price)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Ratings + reviews */}
          <section id="reviews" className="mt-10 scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold text-stone-900">
                Reviews <span className="text-stone-400">({stats.reviewCount.toLocaleString('en-GB')})</span>
              </h2>
              <button
                onClick={() => setReviewOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                <PenLine size={15} /> Write a review
              </button>
            </div>

            <div className="mt-4 grid gap-5 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center justify-center border-stone-100 pr-6 sm:border-r">
                <span className="font-display text-5xl font-semibold text-stone-900">
                  {stats.rating.toFixed(1)}
                </span>
                <Stars value={stats.rating} size={18} className="mt-1" />
                <span className="mt-1 text-sm font-medium text-amber-600">
                  {ratingLabel(stats.rating)}
                </span>
              </div>
              <div className="space-y-2.5 sm:pl-2">
                <ScoreBar label="Food" value={b.scores.food} />
                <ScoreBar label="Service" value={b.scores.service} />
                <ScoreBar label="Ambience" value={b.scores.ambience} />
                <ScoreBar label="Value" value={b.scores.value} />
              </div>
            </div>

            <div className="mt-2">
              {reviews.length === 0 ? (
                <p className="py-8 text-center text-stone-500">
                  No reviews yet — be the first to share your experience.
                </p>
              ) : (
                reviews.map((r) => <ReviewCard key={r.id} review={r} />)
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="font-semibold text-stone-900">Opening hours</h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              {b.hours.map((h) => (
                <li
                  key={h.day}
                  className={clsx(
                    'flex justify-between rounded px-1.5 py-0.5',
                    h.day === today ? 'bg-brand-50 font-semibold text-stone-900' : 'text-stone-600',
                  )}
                >
                  <span>{h.day}</span>
                  <span>{h.close ? `${h.open} – ${h.close}` : h.open}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="font-semibold text-stone-900">Contact & location</h3>
            <div className="mt-3 space-y-3 text-sm">
              <p className="flex items-start gap-2.5 text-stone-600">
                <MapPin size={16} className="mt-0.5 shrink-0 text-brand-500" />
                <span>
                  {b.address}
                  <br />
                  {b.neighbourhood}, {b.postcode}
                </span>
              </p>
              <p className="flex items-center gap-2.5 text-stone-600">
                <Phone size={16} className="shrink-0 text-brand-500" />
                {b.phone}
              </p>
              {b.website && (
                <p className="flex items-center gap-2.5 text-stone-600">
                  <Globe size={16} className="shrink-0 text-brand-500" />
                  <span className="text-brand-600">{b.website}</span>
                </p>
              )}
            </div>
            <div className="mt-4 h-40 overflow-hidden rounded-xl ring-1 ring-stone-200">
              <MapView
                points={[
                  {
                    id: b.id,
                    name: b.name,
                    lat: b.lat,
                    lng: b.lng,
                    slug: b.slug,
                    rating: stats.rating,
                  },
                ]}
                interactive={false}
                zoom={15}
                className="h-full w-full"
              />
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${b.lat},${b.lng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center justify-center gap-1.5 rounded-full border border-stone-200 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              <Navigation size={15} /> Get directions
            </a>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="font-semibold text-stone-900">What this place offers</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {b.amenities.map((a) => (
                <span
                  key={a}
                  className="flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600"
                >
                  <Check size={12} className="text-emerald-600" />
                  {a}
                </span>
              ))}
            </div>
          </div>

          <Link
            to="/business/dashboard"
            className="block rounded-2xl border border-dashed border-stone-300 p-4 text-center text-sm text-stone-500 transition hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-600"
          >
            Own this business?{' '}
            <span className="font-semibold text-brand-600">Manage it on Gander →</span>
          </Link>
        </aside>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-stone-900">
            More {cat.label.toLowerCase()} you might like
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {similar.map((s) => (
              <BusinessCard key={s.id} business={s} />
            ))}
          </div>
        </section>
      )}

      {/* Modals + toast */}
      <ReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} business={b} />
      <BookingModal open={bookOpen} onClose={() => setBookOpen(false)} business={b} mode={booking.mode} />
      <OrderModal open={orderOpen} onClose={() => setOrderOpen(false)} business={b} />
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-lg md:bottom-8">
          {toast}
        </div>
      )}
    </div>
  )
}
