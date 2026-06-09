import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Check,
  Eye,
  Heart,
  PoundSterling,
  Search,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
} from 'lucide-react'
import { businesses } from '../data/businesses'
import { useStore } from '../store/StoreContext'
import SmartImage from '../components/SmartImage'

const benefits = [
  { icon: TrendingUp, title: 'Get discovered', body: 'Show up when locals search Gander for places like yours.' },
  { icon: BarChart3, title: 'Real analytics', body: 'See your views, what people search, and what your reviews say.' },
  { icon: Tag, title: 'Run deals', body: 'Fill quiet tables with vouchers and offers, published in seconds.' },
  { icon: CalendarCheck, title: 'Take bookings', body: 'Accept reservations from your page — zero booking commission.' },
]

const steps = [
  { n: 1, title: 'Claim your listing', body: 'Find your venue below and verify you’re the owner.' },
  { n: 2, title: 'Make it yours', body: 'Add photos, hours, your best dishes and a deal.' },
  { n: 3, title: 'Grow', body: 'Reply to reviews, watch your analytics, win repeat customers.' },
]

// ── Find-your-business search ────────────────────────────────────────────────
function FindYourBusiness() {
  const { liveBusinesses, importedBusinesses } = useStore()
  const [q, setQ] = useState('')

  const allBiz = useMemo(
    () => [...businesses, ...liveBusinesses, ...importedBusinesses],
    [liveBusinesses, importedBusinesses],
  )
  const matches = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (term.length < 2) return []
    return allBiz.filter((b) => b.name.toLowerCase().includes(term)).slice(0, 6)
  }, [q, allBiz])

  return (
    <div className="mt-7 max-w-lg">
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your business name…"
          className="w-full rounded-full border border-white/20 bg-white/95 py-3.5 pl-11 pr-4 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-brand-400"
        />
      </div>
      {matches.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-2xl bg-white text-left shadow-xl">
          {matches.map((b) => (
            <Link
              key={b.id}
              to={`/b/${b.slug}`}
              className="flex items-center gap-3 border-b border-stone-100 px-4 py-2.5 transition last:border-0 hover:bg-stone-50"
            >
              <SmartImage src={b.heroImage} seedFallback={b.id} className="h-9 w-9 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-900">{b.name}</p>
                <p className="truncate text-xs text-stone-500">{b.neighbourhood}</p>
              </div>
              <span className={b.source === 'osm' && !b.claimed ? 'shrink-0 text-xs font-semibold text-brand-600' : 'shrink-0 text-xs font-medium text-stone-400'}>
                {b.source === 'osm' && !b.claimed ? 'Claim →' : 'View'}
              </span>
            </Link>
          ))}
        </div>
      )}
      {q.trim().length >= 2 && matches.length === 0 && (
        <p className="mt-2 text-sm text-stone-400">
          Not listed yet?{' '}
          <Link to="/business/join" className="font-semibold text-brand-400 hover:underline">
            Add your business →
          </Link>
        </p>
      )}
    </div>
  )
}

// ── Analytics showcase (illustrative) ────────────────────────────────────────
function AnalyticsShowcase() {
  return (
    <section className="bg-stone-900 text-white">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
            <Sparkles size={13} /> Owner dashboard
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold">Know exactly what’s working</h2>
          <p className="mx-auto mt-2 max-w-xl text-stone-300">
            Most listing sites give you a phone number and hope. Gander shows you the numbers that matter — and what your customers actually think.
          </p>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <Eye size={18} className="text-sky-400" />
            <p className="mt-2 font-display text-2xl font-semibold">1,240</p>
            <p className="text-xs text-stone-400">profile views · 30 days</p>
            <div className="mt-3 flex items-end gap-1">
              {[5, 8, 6, 11, 9, 14, 12].map((h, i) => (
                <span key={i} className="w-full rounded-sm bg-sky-400/70" style={{ height: h * 3 }} />
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <Search size={18} className="text-brand-400" />
            <p className="mt-2 text-sm font-semibold">People searched</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['brunch', 'coffee near me', 'lunch worthing', 'dog friendly'].map((t) => (
                <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-stone-200">{t}</span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <Heart size={18} className="text-emerald-400" />
            <p className="mt-2 text-sm font-semibold">Customers love</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['coffee', 'staff', 'atmosphere'].map((t) => (
                <span key={t} className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs capitalize text-emerald-200">{t}</span>
              ))}
            </div>
            <p className="mt-3 text-xs text-stone-400">from your reviews, automatically</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-orange-600 p-5">
            <PoundSterling size={18} />
            <p className="mt-2 font-display text-2xl font-semibold">£1,840</p>
            <p className="text-xs text-white/80">driven through Gander</p>
            <p className="mt-3 text-xs text-white/80">+ 32% repeat customers</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/business/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-100"
          >
            See a live demo dashboard <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function BusinessLanding() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 to-stone-800 text-white">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
            <BarChart3 size={13} /> Gander for Business
          </span>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.1] sm:text-5xl">
            Your business is probably <span className="text-brand-400">already on Gander</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-stone-300">
            Find your venue, claim it free, and turn local searches into paying customers. Free to list — you only pay when we sell for you.
          </p>

          <FindYourBusiness />

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/business/join"
              className="flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              Add your business <ArrowRight size={16} />
            </Link>
            <Link
              to="/business/dashboard"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Owner login
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center font-display text-3xl font-semibold text-stone-900">
          Everything you need to stand out
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <b.icon size={22} />
              </div>
              <h3 className="mt-3 font-semibold text-stone-900">{b.title}</h3>
              <p className="mt-1 text-sm text-stone-500">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Analytics showcase */}
      <AnalyticsShowcase />

      {/* Pricing / offer */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid items-center gap-6 rounded-3xl border border-stone-200 bg-white p-8 sm:grid-cols-2 sm:p-10">
          <div>
            <h2 className="font-display text-3xl font-semibold text-stone-900">Simple, fair pricing</h2>
            <p className="mt-2 text-stone-600">
              Free to list and manage your page. Your <strong>first month is commission-free</strong> — after that we take just <strong>12%</strong> when we actually sell a voucher for you. Nothing on bookings, no monthly fee, no setup cost.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
              <Sparkles size={14} /> Your first month is completely commission-free
            </div>
          </div>
          <ul className="space-y-2.5">
            {[
              'Free listing, photos, hours & menu',
              'No commission on bookings',
              'Real analytics & review insights',
              'Cancel anytime — no lock-in',
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-stone-700">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check size={13} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-center font-display text-3xl font-semibold text-stone-900">
            Up and running in minutes
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-500 font-display text-xl font-semibold text-white">
                  {s.n}
                </div>
                <h3 className="mt-3 font-semibold text-stone-900">{s.title}</h3>
                <p className="mt-1 text-sm text-stone-500">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-orange-600 px-6 py-12 text-center text-white sm:px-12">
          <Star className="mx-auto" size={28} fill="currentColor" strokeWidth={0} />
          <h2 className="mt-3 font-display text-3xl font-semibold">Ready to be discovered?</h2>
          <p className="mx-auto mt-2 max-w-md text-white/90">
            It’s free to claim your listing and start winning customers today.
          </p>
          <Link
            to="/business/join"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-600 transition hover:bg-stone-100"
          >
            Claim your listing <ArrowRight size={16} />
          </Link>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/90">
            {['No setup fees', 'No booking commission', 'Cancel anytime'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <Check size={15} /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
