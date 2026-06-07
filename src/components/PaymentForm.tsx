import { useState, type FormEvent } from 'react'
import { CreditCard, Loader2, Lock } from 'lucide-react'
import { formatPrice } from '../lib/format'

function detectBrand(digits: string): string {
  if (/^4/.test(digits)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'Amex'
  if (/^6/.test(digits)) return 'Discover'
  return ''
}

interface Props {
  amount: number
  onPaid: () => void
  onCancel?: () => void
}

export default function PaymentForm({ amount, onPaid, onCancel }: Props) {
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
    window.setTimeout(() => {
      setProcessing(false)
      onPaid()
    }, 1500)
  }

  const field =
    'w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

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
          <input
            value={number}
            onChange={(e) => onNumber(e.target.value)}
            placeholder="4242 4242 4242 4242"
            inputMode="numeric"
            className={field + ' pl-9'}
            required
          />
          {brand && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-500">
              {brand}
            </span>
          )}
        </div>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium text-stone-700">
          Expiry
          <input
            value={exp}
            onChange={(e) => onExp(e.target.value)}
            placeholder="MM/YY"
            inputMode="numeric"
            className={field + ' mt-1'}
            required
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          CVC
          <input
            value={cvc}
            onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="123"
            inputMode="numeric"
            className={field + ' mt-1'}
            required
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-stone-700">
        Name on card
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="A. Morgan"
          className={field + ' mt-1'}
          required
        />
      </label>

      <button
        type="submit"
        disabled={!valid || processing}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 py-3 text-sm font-semibold text-white transition enabled:hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {processing ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Processing…
          </>
        ) : (
          <>Pay {formatPrice(amount)}</>
        )}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-stone-400">
        <Lock size={12} /> Test mode — enter any details. No real charge is made.
      </p>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="w-full text-xs font-medium text-stone-500 hover:text-stone-800"
        >
          Back
        </button>
      )}
    </form>
  )
}
