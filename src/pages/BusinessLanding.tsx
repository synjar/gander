import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Check,
  MessageSquare,
  Star,
  Tag,
  TrendingUp,
} from 'lucide-react'

const benefits = [
  {
    icon: TrendingUp,
    title: 'Reach local customers',
    body: 'Get discovered by thousands of nearby diners searching Gander every day.',
  },
  {
    icon: MessageSquare,
    title: 'Manage your reputation',
    body: 'Reply to reviews, thank your regulars and turn feedback into loyalty.',
  },
  {
    icon: Tag,
    title: 'Run deals & offers',
    body: 'Fill quiet tables with vouchers and set menus, published in seconds.',
  },
  {
    icon: CalendarCheck,
    title: 'Take bookings',
    body: 'Accept reservations directly from your Gander page — no commission.',
  },
]

const steps = [
  { n: 1, title: 'Claim your listing', body: 'Find your venue and verify you’re the owner.' },
  { n: 2, title: 'Build your page', body: 'Add photos, hours, menus and your story.' },
  { n: 3, title: 'Grow', body: 'Respond to reviews, post deals and watch the bookings roll in.' },
]

export default function BusinessLanding() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 to-stone-800 text-white">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
            <BarChart3 size={13} /> Gander for Business
          </span>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.1] sm:text-6xl">
            Grow your business with <span className="text-brand-400">Gander</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-stone-300">
            Join the high-street venues reaching new customers, managing their reviews and
            filling tables — all from one simple dashboard.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/business/join"
              className="flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              List your business <ArrowRight size={16} />
            </Link>
            <Link
              to="/business/dashboard"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Owner login
            </Link>
          </div>
          <div className="mt-10 grid max-w-lg grid-cols-3 gap-6">
            {[
              ['2M+', 'monthly visitors'],
              ['480k', 'local reviews'],
              ['38', 'neighbourhoods'],
            ].map(([v, l]) => (
              <div key={l}>
                <p className="font-display text-3xl font-semibold">{v}</p>
                <p className="text-sm text-stone-400">{l}</p>
              </div>
            ))}
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
            It’s free to claim your listing and start responding to customers today.
          </p>
          <Link
            to="/business/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-600 transition hover:bg-stone-100"
          >
            Get started <ArrowRight size={16} />
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
