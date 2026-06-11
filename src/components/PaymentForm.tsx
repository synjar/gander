import { useEffect, useState, type FormEvent } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CreditCard, Loader2, Lock } from 'lucide-react'
import { formatPrice } from '../lib/format'
import * as db from '../lib/db'

const PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined
const stripePromise = PK ? loadStripe(PK) : null

interface Props {
  amount: number
  businessId?: string
  onPaid: () => void
  onCancel?: () => void
}

// ---- Mock form used in demo / local dev (no Stripe key configured) ----------

function detectBrand(digits: string): string {
  if (/^4/.test(digits)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'Amex'
  if (/^6/.test(digits)) return 'Discover'
  return ''
}

function MockForm({ amount, onPaid, onCancel }: Props) {
  const [number, setNumber] = useState('')
  const [exp, setExp] = useState('')
  const [cvc, setCvc] = useState('')
  const [name, setName] = useState('')
  const [processing, setProcessing] = useState(false)

  const digits = number.replace(/\s/g, '')
  const brand = detectBrand(digits)
  const valid = digits.length >= 15 && exp.length === 5 && cvc.length >= 3 && name.trim().length > 1

  function onNumber(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 16)
    setNumber(d.replace(/(.{4})/g, '$1 ').trim())
  }
  function onExp(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 4)
    setExp(d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d)
  }

  function pay(e: FormEvent) {
    e.preventDefault()
    setProcessing(true)
    window.setTimeout(() => { setProcessing(false); onPaid() }, 1500)
  }

  const field = 'w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

  return (
    <form onSubmit={pay} className="space-y-3">
      <div className="rounded-xl bg-stone-50 p-3 text-center">
        <p className="text-xs text-stone-500">Amount to pay</p>
        <p className="font-display text-2xl font-semibold text-stone-900">{formatPrice(amount)}</p>
      </div>
      <label className="block text-sm font-medium text-stone-700">
        Card number
        <div className="relative mt-1">
          <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={number} onChange={(e) => onNumber(e.target.value)} placeholder="4242 4242 4242 4242" inputMode="numeric" className={field + ' pl-9'} required />
          {brand && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-500">{brand}</span>}
        </div>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium text-stone-700">
          Expiry
          <input value={exp} onChange={(e) => onExp(e.target.value)} placeholder="MM/YY" inputMode="numeric" className={field + ' mt-1'} required />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          CVC
          <input value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" inputMode="numeric" className={field + ' mt-1'} required />
        </label>
      </div>
      <label className="block text-sm font-medium text-stone-700">
        Name on card
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="A. Morgan" className={field + ' mt-1'} required />
      </label>
      <button type="submit" disabled={!valid || processing} className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 py-3 text-sm font-semibold text-white transition enabled:hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40">
        {processing ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : <>Pay {formatPrice(amount)}</>}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-stone-400">
        <Lock size={12} /> Test mode — enter any details. No real charge is made.
      </p>
      {onCancel && <button type="button" onClick={onCancel} className="w-full text-xs font-medium text-stone-500 hover:text-stone-800">Back</button>}
    </form>
  )
}

// ---- Real Stripe inner form -------------------------------------------------

function StripeForm({ amount, onPaid, onCancel }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setProcessing(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? 'Something went wrong.')
      setProcessing(false)
      return
    }

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })

    if (result.error) {
      setError(result.error.message ?? 'Payment failed.')
      setProcessing(false)
    } else {
      onPaid()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-stone-50 p-3 text-center">
        <p className="text-xs text-stone-500">Amount to pay</p>
        <p className="font-display text-2xl font-semibold text-stone-900">{formatPrice(amount)}</p>
      </div>
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 py-3 text-sm font-semibold text-white transition enabled:hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {processing ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : <>Pay {formatPrice(amount)}</>}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-stone-400">
        <Lock size={12} /> Secured by Stripe
      </p>
      {onCancel && <button type="button" onClick={onCancel} className="w-full text-xs font-medium text-stone-500 hover:text-stone-800">Back</button>}
    </form>
  )
}

// ---- Outer wrapper: fetches client_secret then renders Elements -------------

export default function PaymentForm({ amount, businessId, onPaid, onCancel }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null)
  const [feeRate, setFeeRate] = useState(0.05)

  useEffect(() => {
    if (!stripePromise) return

    async function init() {
      // Look up merchant's connected Stripe account (if any)
      const accountId = businessId ? await db.getMerchantStripeAccount(businessId) : null
      setStripeAccountId(accountId)

      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, stripeAccountId: accountId ?? undefined, businessId }),
      })
      const json = await res.json() as { clientSecret?: string; error?: string; feeRate?: number }
      if (json.error) { setFetchError(json.error); return }
      if (typeof json.feeRate === 'number') setFeeRate(json.feeRate)
      if (json.clientSecret) setClientSecret(json.clientSecret)
    }

    init().catch(() => setFetchError('Could not connect to payment service.'))
  }, [amount, businessId])

  if (!stripePromise) return <MockForm amount={amount} onPaid={onPaid} onCancel={onCancel} />

  if (fetchError) return <p className="py-4 text-center text-sm text-red-600">{fetchError}</p>

  if (!clientSecret) return (
    <div className="py-8 text-center">
      <Loader2 size={22} className="mx-auto animate-spin text-stone-400" />
      <p className="mt-2 text-sm text-stone-400">Loading payment form…</p>
    </div>
  )

  const merchantPayout = stripeAccountId ? amount * (1 - feeRate) : null

  return (
    <div className="space-y-3">
      {merchantPayout !== null && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs">
          <span className="text-emerald-700">Merchant receives</span>
          <span className="font-semibold text-emerald-800">
            {formatPrice(merchantPayout)}{' '}
            {feeRate === 0 ? '(commission-free)' : `(after ${Math.round(feeRate * 100)}% platform fee)`}
          </span>
        </div>
      )}
      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
        <StripeForm amount={amount} onPaid={onPaid} onCancel={onCancel} />
      </Elements>
    </div>
  )
}
