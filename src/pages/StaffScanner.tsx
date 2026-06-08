import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ShieldOff, Store } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import * as db from '../lib/db'
import ScanAndRedeem from '../components/ScanAndRedeem'
import AuthModal from '../components/AuthModal'

type State = 'loading' | 'auth' | 'notStaff' | 'ready'

export default function StaffScanner() {
  const { user, configured, loading: authLoading } = useAuth()
  const [state, setState] = useState<State>('loading')
  const [business, setBusiness] = useState<{ businessId: string; businessName: string } | null>(null)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!configured || user.isGuest) {
      setState('auth')
      return
    }

    if (!db.backendEnabled) {
      setState('notStaff')
      return
    }

    db.getStaffBusiness(user.email ?? '')
      .then((biz) => {
        if (biz) {
          setBusiness(biz)
          setState('ready')
        } else {
          setState('notStaff')
        }
      })
      .catch(() => setState('notStaff'))
  }, [authLoading, configured, user])

  if (state === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand-500" />
      </div>
    )
  }

  if (state === 'auth') {
    return (
      <div className="mx-auto max-w-sm px-4 py-20 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-100">
          <Store size={28} className="text-brand-600" />
        </div>
        <h1 className="mt-4 font-display text-xl font-semibold text-stone-900">Staff sign-in required</h1>
        <p className="mt-2 text-sm text-stone-500">
          Sign in with the email your manager added to use this scanner.
        </p>
        <button
          onClick={() => setShowAuth(true)}
          className="mt-6 w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Sign in
        </button>
        {showAuth && <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />}
      </div>
    )
  }

  if (state === 'notStaff') {
    return (
      <div className="mx-auto max-w-sm px-4 py-20 text-center">
        <ShieldOff size={48} className="mx-auto text-stone-300" />
        <h1 className="mt-4 font-display text-xl font-semibold text-stone-900">Access not set up</h1>
        <p className="mt-2 text-sm text-stone-500">
          {configured && !user.isGuest
            ? `${user.email} hasn't been added as staff for any venue. Ask your manager to add you in their dashboard.`
            : 'Sign in with the email your manager registered you with.'}
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-full border border-stone-200 px-6 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
        >
          Back to Gander
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-100">
          <Store size={22} className="text-brand-600" />
        </div>
        <h1 className="mt-3 font-display text-lg font-semibold text-stone-900">
          {business?.businessName}
        </h1>
        <p className="text-sm text-stone-500">Voucher scanner · {user.name}</p>
      </div>

      <ScanAndRedeem businessId={business?.businessId} title="Scan customer voucher" />
    </div>
  )
}
