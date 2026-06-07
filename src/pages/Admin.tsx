import { Link } from 'react-router-dom'
import {
  BarChart3,
  Bike,
  Building2,
  CalendarCheck,
  Eye,
  EyeOff,
  MessageSquare,
  PoundSterling,
  Star,
  Tag,
  Ticket,
} from 'lucide-react'
import clsx from 'clsx'
import { businesses, businessesById } from '../data/businesses'
import { cities } from '../data/cities'
import { categories, categoryMap } from '../data/categories'
import { useStore } from '../store/StoreContext'
import { formatPrice, priceLevel } from '../lib/format'
import Stars from '../components/Stars'
import Avatar from '../components/Avatar'

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof Star
  label: string
  value: string | number
  tint: string
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className={clsx('grid h-9 w-9 place-items-center rounded-lg', tint)}>
        <Icon size={18} />
      </div>
      <p className="mt-2.5 font-display text-2xl font-semibold text-stone-900">{value}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  )
}

function ChartCard({
  title,
  rows,
  colour,
}: {
  title: string
  rows: { label: string; value: number }[]
  colour: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <h3 className="font-semibold text-stone-900">{title}</h3>
      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-sm text-stone-600">{r.label}</span>
            <div className="h-2.5 flex-1 rounded-full bg-stone-100">
              <div
                className={clsx('h-full rounded-full', colour)}
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-sm font-semibold text-stone-700">
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Admin() {
  const {
    allReviews,
    allDeals,
    bookings,
    vouchers,
    orders,
    isReviewHidden,
    toggleReviewHidden,
    isBusinessHidden,
    toggleBusinessHidden,
  } = useStore()

  const revenue =
    vouchers.reduce((s, v) => s + v.dealPrice, 0) + orders.reduce((s, o) => s + o.total, 0)
  const avgRating = businesses.reduce((s, b) => s + b.rating, 0) / businesses.length

  const byCity = cities.map((c) => ({
    label: c.name,
    value: businesses.filter((b) => b.cityId === c.id).length,
  }))
  const byCategory = categories.map((c) => ({
    label: c.label,
    value: businesses.filter((b) => b.category === c.id).length,
  }))
  const ratingBands = [
    { label: '4.5★ +', test: (r: number) => r >= 4.5 },
    { label: '4.0–4.5', test: (r: number) => r >= 4 && r < 4.5 },
    { label: '3.5–4.0', test: (r: number) => r >= 3.5 && r < 4 },
    { label: 'Under 3.5', test: (r: number) => r < 3.5 },
  ].map((b) => ({ label: b.label, value: businesses.filter((x) => b.test(x.rating)).length }))

  const recentReviews = allReviews.slice(0, 8)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-stone-900 text-white">
            <BarChart3 size={18} />
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold text-stone-900">Admin console</h1>
            <p className="text-xs text-stone-500">Gander platform overview · internal</p>
          </div>
        </div>
        <Link to="/" className="text-sm font-medium text-brand-600 hover:underline">
          ← Back to app
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <StatCard icon={Building2} label="Venues" value={businesses.length} tint="bg-stone-100 text-stone-700" />
        <StatCard icon={MessageSquare} label="Reviews" value={allReviews.length} tint="bg-sky-100 text-sky-700" />
        <StatCard icon={Tag} label="Deals" value={allDeals.length} tint="bg-emerald-100 text-emerald-700" />
        <StatCard icon={Star} label="Avg rating" value={avgRating.toFixed(2)} tint="bg-amber-100 text-amber-700" />
        <StatCard icon={CalendarCheck} label="Bookings" value={bookings.length} tint="bg-violet-100 text-violet-700" />
        <StatCard icon={Ticket} label="Vouchers" value={vouchers.length} tint="bg-rose-100 text-rose-700" />
        <StatCard icon={Bike} label="Orders" value={orders.length} tint="bg-orange-100 text-orange-700" />
        <StatCard icon={PoundSterling} label="Revenue" value={formatPrice(revenue)} tint="bg-brand-100 text-brand-700" />
      </div>

      {/* Charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Venues by city" rows={byCity} colour="bg-brand-400" />
        <ChartCard title="Venues by category" rows={byCategory} colour="bg-sky-400" />
        <ChartCard title="Ratings distribution" rows={ratingBands} colour="bg-amber-400" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        {/* Moderation: reviews */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-stone-900">
            <MessageSquare size={18} className="text-brand-500" /> Recent reviews
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">Hide anything that breaks the guidelines.</p>
          <div className="mt-2 divide-y divide-stone-100">
            {recentReviews.map((r) => {
              const hidden = isReviewHidden(r.id)
              const biz = businessesById[r.businessId]
              return (
                <div key={r.id} className={clsx('flex gap-3 py-3', hidden && 'opacity-50')}>
                  <Avatar name={r.authorName} src={r.authorAvatar} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-900">{r.authorName}</span>
                      <Stars value={r.rating} size={12} />
                      {biz && <span className="truncate text-xs text-stone-400">· {biz.name}</span>}
                    </div>
                    <p className="line-clamp-2 text-sm text-stone-600">{r.body}</p>
                  </div>
                  <button
                    onClick={() => toggleReviewHidden(r.id)}
                    className={clsx(
                      'flex h-8 shrink-0 items-center gap-1 self-start rounded-full border px-2.5 text-xs font-medium transition',
                      hidden
                        ? 'border-stone-200 text-stone-500 hover:bg-stone-50'
                        : 'border-rose-200 text-rose-600 hover:bg-rose-50',
                    )}
                  >
                    {hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                    {hidden ? 'Show' : 'Hide'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* Moderation: venues */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-stone-900">
            <Building2 size={18} className="text-brand-500" /> Venues
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">
            {businesses.length} venues · hidden venues are removed from discovery.
          </p>
          <div className="mt-2 max-h-[28rem] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white text-left text-xs text-stone-400">
                <tr>
                  <th className="py-2 font-medium">Venue</th>
                  <th className="py-2 font-medium">City</th>
                  <th className="py-2 text-right font-medium">Rating</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {businesses.map((b) => {
                  const hidden = isBusinessHidden(b.id)
                  return (
                    <tr key={b.id} className={clsx(hidden && 'opacity-50')}>
                      <td className="py-2 pr-2">
                        <Link to={`/b/${b.slug}`} className="font-medium text-stone-900 hover:text-brand-600">
                          {b.name}
                        </Link>
                        <div className="text-xs text-stone-400">
                          {categoryMap[b.category].label} · {priceLevel(b.priceLevel)}
                        </div>
                      </td>
                      <td className="py-2 pr-2 text-stone-500">{b.city}</td>
                      <td className="py-2 text-right">
                        <span className="font-semibold text-stone-800">{b.rating.toFixed(1)}</span>
                        <span className="ml-1 text-xs text-stone-400">({b.reviewCount})</span>
                      </td>
                      <td className="py-2 pl-2 text-right">
                        <button
                          onClick={() => toggleBusinessHidden(b.id)}
                          className={clsx(
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition',
                            hidden
                              ? 'border-stone-200 text-stone-500 hover:bg-stone-50'
                              : 'border-rose-200 text-rose-600 hover:bg-rose-50',
                          )}
                        >
                          {hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                          {hidden ? 'Show' : 'Hide'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
