import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Check, Loader2, X } from 'lucide-react'
import type { Business } from '../data/types'
import { useAuth } from '../auth/AuthContext'
import { useStore } from '../store/StoreContext'
import AuthModal from './AuthModal'

interface Props {
  open: boolean
  onClose: () => void
  business: Business
}

export default function ClaimModal({ open, onClose, business }: Props) {
  const { user, configured } = useAuth()
  const { claimBusiness } = useStore()
  const navigate = useNavigate()
  const isLoggedIn = configured && !user.isGuest

  const [attested, setAttested] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  if (!open) return null

  async function handleClaim() {
    if (!attested || busy) return
    setBusy(true)
    setError('')
    try {
      await claimBusiness(business.id)
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not claim this listing')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-stone-900">
            <Building2 size={18} className="shrink-0 text-brand-500" /> Claim {business.name}
          </h2>
          <button onClick={onClose} aria-label="Close" className="shrink-0 rounded-full p-1.5 text-stone-400 hover:bg-stone-100">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="py-4 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <Check size={30} />
            </div>
            <h3 className="mt-3 font-display text-xl font-semibold text-stone-900">It’s yours!</h3>
            <p className="mt-1 text-sm text-stone-500">
              You’re now managing {business.name}. Add photos, hours, deals and reply to reviews from your dashboard.
            </p>
            <button
              onClick={() => { onClose(); navigate('/business/dashboard') }}
              className="mt-4 w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              Open your dashboard →
            </button>
          </div>
        ) : !isLoggedIn ? (
          <div className="py-1">
            <p className="text-sm text-stone-600">
              Claiming <strong>{business.name}</strong> is free and takes about 2 minutes — you just
              need a Gander account so we know it’s yours.
            </p>
            <button
              onClick={() => setAuthOpen(true)}
              className="mt-4 w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              Sign in or create a free account
            </button>
            <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
          </div>
        ) : (
          <>
            <p className="text-sm text-stone-600">
              Claiming unlocks the merchant dashboard for this venue — photos, hours, deals, bookings, reviews and analytics.
            </p>
            <label className="mt-4 flex items-start gap-2.5 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={attested}
                onChange={(e) => setAttested(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-brand-500 focus:ring-brand-400"
              />
              <span>I confirm I’m the owner or an authorised representative of {business.name}.</span>
            </label>
            {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
            <button
              onClick={handleClaim}
              disabled={!attested || busy}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-40"
            >
              {busy ? <><Loader2 size={15} className="animate-spin" /> Claiming…</> : 'Claim this listing'}
            </button>
            <p className="mt-2 text-center text-xs text-stone-400">
              Fraudulent claims are removed — we may verify ownership.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
