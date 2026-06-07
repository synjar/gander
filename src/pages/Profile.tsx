import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  Bike,
  CalendarCheck,
  Heart,
  LogOut,
  MapPin,
  Settings,
  Star,
  Ticket,
} from 'lucide-react'
import clsx from 'clsx'
import { currentUser } from '../data/users'
import { businessesById } from '../data/businesses'
import { useStore } from '../store/StoreContext'
import { useAuth } from '../auth/AuthContext'
import { formatPrice } from '../lib/format'
import Avatar from '../components/Avatar'
import BusinessCard from '../components/BusinessCard'
import ReviewCard from '../components/ReviewCard'
import LevelBadge from '../components/LevelBadge'

type Tab = 'reviews' | 'saved' | 'bookings' | 'wallet' | 'orders'

function prettyDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-xl font-semibold text-stone-900">{value}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  body,
  cta,
}: {
  icon: typeof Heart
  title: string
  body: string
  cta?: { to: string; label: string }
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 py-16 text-center">
      <Icon className="mx-auto text-stone-300" size={38} />
      <p className="mt-3 font-semibold text-stone-700">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-stone-500">{body}</p>
      {cta && (
        <Link
          to={cta.to}
          className="mt-5 inline-block rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          {cta.label}
        </Link>
      )}
    </div>
  )
}

export default function Profile() {
  const { allReviews, favourites, bookings, vouchers, orders, cancelBooking } = useStore()
  const { user, configured, signOut } = useAuth()
  const [tab, setTab] = useState<Tab>('reviews')

  const myReviews = allReviews.filter((r) => r.authorId === 'me')
  const saved = favourites.map((id) => businessesById[id]).filter(Boolean)

  const isRealUser = configured && !user.isGuest
  const profile = isRealUser
    ? {
        level: Math.max(1, Math.floor(myReviews.length / 3) + 1),
        points: myReviews.length * 200,
        neighbourhood: '',
        joined: 'recently',
        bio: '',
        photoCount: 0,
        followerCount: 0,
        followingCount: 0,
      }
    : currentUser

  const band = 2000
  const toNext = band - (profile.points % band)
  const progress = ((profile.points % band) / band) * 100

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'reviews', label: 'Reviews', count: myReviews.length },
    { id: 'saved', label: 'Saved', count: saved.length },
    { id: 'bookings', label: 'Bookings', count: bookings.length },
    { id: 'wallet', label: 'Wallet', count: vouchers.length },
    { id: 'orders', label: 'Orders', count: orders.length },
  ]

  return (
    <div>
      {/* Cover + header */}
      <div className="h-36 bg-gradient-to-r from-brand-500 via-orange-500 to-amber-500 sm:h-44" />
      <div className="mx-auto max-w-5xl px-4">
        <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Avatar
              name={user.name}
              src={user.avatar}
              size={96}
              className="ring-4 ring-white"
            />
            <div className="pb-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-semibold text-stone-900">
                  {user.name}
                </h1>
                <LevelBadge level={profile.level} />
              </div>
              <p className="flex items-center gap-1 text-sm text-stone-500">
                <MapPin size={13} />
                {profile.neighbourhood ? `${profile.neighbourhood} · ` : ''}Joined {profile.joined}
              </p>
              {user.email && <p className="text-sm text-stone-400">{user.email}</p>}
            </div>
          </div>
          {configured && !user.isGuest ? (
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 self-start rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 sm:self-auto"
            >
              <LogOut size={15} /> Sign out
            </button>
          ) : (
            <button className="flex items-center gap-1.5 self-start rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 sm:self-auto">
              <Settings size={15} /> Edit profile
            </button>
          )}
        </div>

        {profile.bio && <p className="mt-4 max-w-xl text-stone-600">{profile.bio}</p>}

        {/* Stats */}
        <div className="mt-5 flex items-center gap-6">
          <Stat value={myReviews.length} label="Reviews" />
          <Stat value={profile.photoCount} label="Photos" />
          <Stat value={profile.followerCount} label="Followers" />
          <Stat value={profile.followingCount} label="Following" />
        </div>

        {/* Level progress */}
        <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-semibold text-stone-900">
              <Award size={16} className="text-brand-500" /> Level {profile.level} reviewer
            </span>
            <span className="text-stone-500">
              {profile.points.toLocaleString('en-GB')} pts ·{' '}
              <span className="font-medium text-brand-600">{toNext} to Level {profile.level + 1}</span>
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 border-b border-stone-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                'relative px-4 py-3 text-sm font-semibold transition',
                tab === t.id ? 'text-brand-600' : 'text-stone-500 hover:text-stone-800',
              )}
            >
              {t.label}
              {t.count > 0 && (
                <span className="ml-1.5 rounded-full bg-stone-100 px-1.5 py-0.5 text-xs text-stone-500">
                  {t.count}
                </span>
              )}
              {tab === t.id && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-500" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="py-6">
          {tab === 'reviews' &&
            (myReviews.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No reviews yet"
                body="Share your first review and start earning points towards the next level."
                cta={{ to: '/', label: 'Find a place to review' }}
              />
            ) : (
              <div className="divide-y divide-stone-100">
                {myReviews.map((r) => {
                  const biz = businessesById[r.businessId]
                  return (
                    <div key={r.id} className="pt-2 first:pt-0">
                      {biz && (
                        <Link
                          to={`/b/${biz.slug}`}
                          className="flex items-center gap-1.5 pt-4 text-sm font-semibold text-stone-900 hover:text-brand-600"
                        >
                          <MapPin size={14} className="text-brand-500" />
                          {biz.name}
                          <span className="font-normal text-stone-400">· {biz.neighbourhood}</span>
                        </Link>
                      )}
                      <ReviewCard review={r} />
                    </div>
                  )
                })}
              </div>
            ))}

          {tab === 'saved' &&
            (saved.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="Nothing saved yet"
                body="Tap the heart on any place to save it here for later."
                cta={{ to: '/', label: 'Explore places' }}
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {saved.map((b) => (
                  <BusinessCard key={b.id} business={b} />
                ))}
              </div>
            ))}

          {tab === 'bookings' &&
            (bookings.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="No bookings yet"
                body="Book a table, class or treatment and it’ll appear here."
                cta={{ to: '/', label: 'Find somewhere to book' }}
              />
            ) : (
              <div className="space-y-3">
                {bookings.map((bk) => {
                  const biz = businessesById[bk.businessId]
                  return (
                    <div
                      key={bk.id}
                      className="flex flex-wrap items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4"
                    >
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                        <CalendarCheck size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={biz ? `/b/${biz.slug}` : '#'}
                          className="font-semibold text-stone-900 hover:text-brand-600"
                        >
                          {bk.businessName}
                        </Link>
                        <p className="text-sm text-stone-500">
                          {prettyDate(bk.date)} · {bk.time} · {bk.partySize}{' '}
                          {bk.partySize === 1 ? 'guest' : 'guests'}
                          {bk.occasion ? ` · ${bk.occasion}` : ''}
                        </p>
                      </div>
                      <span
                        className={clsx(
                          'rounded-full px-2.5 py-1 text-xs font-semibold',
                          bk.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-stone-100 text-stone-500 line-through',
                        )}
                      >
                        {bk.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                      </span>
                      {bk.status === 'confirmed' && (
                        <button
                          onClick={() => cancelBooking(bk.id)}
                          className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}

          {tab === 'wallet' &&
            (vouchers.length === 0 ? (
              <EmptyState
                icon={Ticket}
                title="Your wallet is empty"
                body="Buy a deal voucher and it’ll be stored here, ready to redeem."
                cta={{ to: '/deals', label: 'Browse deals' }}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {vouchers.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/60 p-4"
                  >
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-brand-500">
                      <Ticket size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-stone-900">{v.title}</p>
                      <p className="text-sm text-stone-500">{v.businessName}</p>
                      <p className="mt-0.5 font-mono text-sm font-bold tracking-wider text-brand-700">
                        {v.code}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold text-stone-700">
                      {formatPrice(v.dealPrice)}
                    </span>
                  </div>
                ))}
              </div>
            ))}

          {tab === 'orders' &&
            (orders.length === 0 ? (
              <EmptyState
                icon={Bike}
                title="No orders yet"
                body="Order delivery from a venue and it’ll appear here."
                cta={{ to: '/', label: 'Find food to order' }}
              />
            ) : (
              <div className="space-y-3">
                {orders.map((o) => {
                  const biz = businessesById[o.businessId]
                  return (
                    <div
                      key={o.id}
                      className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4"
                    >
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Bike size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={biz ? `/b/${biz.slug}` : '#'}
                          className="font-semibold text-stone-900 hover:text-brand-600"
                        >
                          {o.businessName}
                        </Link>
                        <p className="text-sm text-stone-500">
                          {o.items} {o.items === 1 ? 'item' : 'items'} ·{' '}
                          {new Date(o.createdAt).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold text-stone-700">
                        {formatPrice(o.total)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
