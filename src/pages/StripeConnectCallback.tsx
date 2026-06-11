import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react'
import * as db from '../lib/db'

type Phase = 'saving' | 'done' | 'error' | 'refresh'

export default function StripeConnectCallback() {
  const [params] = useSearchParams()
  const [phase, setPhase] = useState<Phase>('saving')
  const [errorMsg, setErrorMsg] = useState('')

  const success = params.get('success') === 'true'
  const refresh = params.get('refresh') === 'true'
  const accountId = params.get('account') ?? ''
  const businessId = params.get('businessId') ?? ''

  useEffect(() => {
    if (refresh) {
      setPhase('refresh')
      return
    }
    if (!success || !accountId || !businessId) {
      setErrorMsg('Missing required parameters in the redirect URL.')
      setPhase('error')
      return
    }

    db.saveMerchantStripeAccount(businessId, accountId)
      .then(() => setPhase('done'))
      .catch((err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : String(err))
        setPhase('error')
      })
  }, [success, refresh, accountId, businessId])

  return (
    <div className="mx-auto max-w-sm px-4 py-20 text-center">
      {phase === 'saving' && (
        <>
          <Loader2 size={40} className="mx-auto animate-spin text-brand-500" />
          <p className="mt-4 text-stone-500">Connecting your Stripe account…</p>
        </>
      )}

      {phase === 'done' && (
        <>
          <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
          <h1 className="mt-4 font-display text-xl font-semibold text-stone-900">Stripe connected!</h1>
          <p className="mt-2 text-sm text-stone-500">
            You'll now automatically receive payouts when customers buy your deals.
            Your first 5 months are commission-free; after that Gander keeps a 5% fee — the rest goes straight to your bank.
          </p>
          <Link
            to="/business/dashboard"
            className="mt-6 inline-block rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Back to dashboard
          </Link>
        </>
      )}

      {phase === 'refresh' && (
        <>
          <RefreshCw size={40} className="mx-auto text-stone-400" />
          <h1 className="mt-4 font-display text-xl font-semibold text-stone-900">Session expired</h1>
          <p className="mt-2 text-sm text-stone-500">
            Your onboarding session timed out. Go back to the dashboard and try connecting again.
          </p>
          <Link
            to="/business/dashboard"
            className="mt-6 inline-block rounded-full border border-stone-200 px-6 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Back to dashboard
          </Link>
        </>
      )}

      {phase === 'error' && (
        <>
          <XCircle size={48} className="mx-auto text-rose-400" />
          <h1 className="mt-4 font-display text-xl font-semibold text-stone-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-stone-500">{errorMsg}</p>
          <Link
            to="/business/dashboard"
            className="mt-6 inline-block rounded-full border border-stone-200 px-6 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Back to dashboard
          </Link>
        </>
      )}
    </div>
  )
}
