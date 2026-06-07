import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, ChevronRight, Clock, MapPin, ShieldCheck, Ticket } from 'lucide-react'
import { businessesById } from '../data/businesses'
import { categoryMap } from '../data/categories'
import { discountPct, formatPrice } from '../lib/format'
import { useStore } from '../store/StoreContext'
import type { Voucher } from '../data/types'
import SmartImage from '../components/SmartImage'
import Stars from '../components/Stars'
import PaymentForm from '../components/PaymentForm'

export default function DealDetail() {
  const { id } = useParams()
  const { buyVoucher, dealById } = useStore()
  const deal = id ? dealById(id) : undefined
  const [voucher, setVoucher] = useState<Voucher | null>(null)
  const [paying, setPaying] = useState(false)

  if (!deal) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-stone-900">Deal not found</h1>
        <Link to="/deals" className="mt-4 inline-block text-brand-600 hover:underline">
          Browse all deals
        </Link>
      </div>
    )
  }

  const biz = businessesById[deal.businessId]
  const cat = biz ? categoryMap[biz.category] : undefined
  const pct = discountPct(deal.originalPrice, deal.dealPrice)
  const saving = deal.originalPrice - deal.dealPrice

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <nav className="mb-3 flex items-center gap-1 text-xs text-stone-400">
        <Link to="/deals" className="hover:text-stone-600">
          Deals
        </Link>
        <ChevronRight size={12} />
        <span className="text-stone-600">{deal.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="relative overflow-hidden rounded-3xl">
            <SmartImage
              src={deal.image}
              seedFallback={deal.id}
              emoji={cat?.emoji}
              className="aspect-[16/10] w-full object-cover"
            />
            <span className="absolute left-4 top-4 rounded-full bg-brand-500 px-3 py-1.5 text-sm font-bold text-white shadow">
              -{pct}%
            </span>
          </div>

          <h1 className="mt-5 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
            {deal.title}
          </h1>

          {biz && (
            <Link
              to={`/b/${biz.slug}`}
              className="mt-3 flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 transition hover:border-brand-200"
            >
              <SmartImage
                src={biz.heroImage}
                seedFallback={biz.id}
                emoji={cat?.emoji}
                className="h-14 w-14 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-stone-900">{biz.name}</p>
                <div className="flex items-center gap-1.5 text-sm text-stone-500">
                  <Stars value={biz.rating} size={13} />
                  <span>{biz.rating.toFixed(1)}</span>
                  <span className="text-stone-300">·</span>
                  <MapPin size={12} /> {biz.neighbourhood}
                </div>
              </div>
              <ChevronRight size={18} className="text-stone-400" />
            </Link>
          )}

          <section className="mt-6">
            <h2 className="font-display text-lg font-semibold text-stone-900">What you’ll get</h2>
            <p className="mt-2 text-stone-600">{deal.description}</p>
            <ul className="mt-3 space-y-2 text-sm text-stone-600">
              {['Instant voucher delivered to your Gander wallet', 'Redeem in person — just show the code', 'Subject to availability; booking recommended'].map(
                (line) => (
                  <li key={line} className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                    {line}
                  </li>
                ),
              )}
            </ul>
          </section>

          <section className="mt-6 rounded-2xl bg-stone-50 p-4 text-sm text-stone-500">
            <h3 className="font-semibold text-stone-700">The fine print</h3>
            <p className="mt-1">
              Valid until {deal.expires}. One voucher per person per visit. Not valid with other
              offers. This is a prototype — no payment will be taken.
            </p>
          </section>
        </div>

        {/* Purchase panel */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            {voucher ? (
              <div className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check size={30} />
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold text-stone-900">
                  Voucher purchased
                </h3>
                <p className="mt-1 text-sm text-stone-500">Saved to your wallet. Show this at {biz?.name}.</p>
                <div className="mt-4 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50 p-4">
                  <Ticket className="mx-auto text-brand-500" size={22} />
                  <p className="mt-1 text-xs text-stone-500">Voucher code</p>
                  <p className="font-mono text-lg font-bold tracking-wider text-stone-900">
                    {voucher.code}
                  </p>
                </div>
                <Link
                  to="/me"
                  className="mt-4 block w-full rounded-full bg-stone-900 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
                >
                  View in wallet
                </Link>
              </div>
            ) : paying ? (
              <PaymentForm
                amount={deal.dealPrice}
                onPaid={() => {
                  setVoucher(buyVoucher(deal, biz?.name ?? 'the venue'))
                  setPaying(false)
                }}
                onCancel={() => setPaying(false)}
              />
            ) : (
              <>
                <div className="flex items-end gap-2">
                  <span className="font-display text-4xl font-semibold text-stone-900">
                    {formatPrice(deal.dealPrice)}
                  </span>
                  <span className="mb-1 text-lg text-stone-400 line-through">
                    {formatPrice(deal.originalPrice)}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-emerald-600">
                  You save {formatPrice(saving)} ({pct}%)
                </p>

                <div className="mt-4 space-y-2 border-y border-stone-100 py-4 text-sm">
                  <p className="flex items-center justify-between text-stone-500">
                    <span className="flex items-center gap-1.5">
                      <Ticket size={15} /> Bought
                    </span>
                    <span className="font-medium text-stone-700">
                      {deal.sold.toLocaleString('en-GB')} times
                    </span>
                  </p>
                  <p className="flex items-center justify-between text-stone-500">
                    <span className="flex items-center gap-1.5">
                      <Clock size={15} /> Valid until
                    </span>
                    <span className="font-medium text-stone-700">{deal.expires}</span>
                  </p>
                </div>

                <button
                  onClick={() => setPaying(true)}
                  className="mt-4 w-full rounded-full bg-brand-500 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-600"
                >
                  Buy voucher · {formatPrice(deal.dealPrice)}
                </button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-stone-400">
                  <ShieldCheck size={14} className="text-emerald-500" /> Free cancellation within 24
                  hours
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
