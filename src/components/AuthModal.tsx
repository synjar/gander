import { useState, type FormEvent } from 'react'
import { Info } from 'lucide-react'
import clsx from 'clsx'
import Modal from './Modal'
import { useAuth } from '../auth/AuthContext'

interface Props {
  open: boolean
  onClose: () => void
}

export default function AuthModal({ open, onClose }: Props) {
  const { signIn, signUp, configured } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    const res =
      mode === 'in' ? await signIn(email, password) : await signUp(name, email, password)
    setBusy(false)
    if (res.error) {
      setError(res.error)
      return
    }
    if (mode === 'up') {
      setNotice('Account created. Check your email to confirm, then sign in.')
      setMode('in')
    } else {
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={mode === 'in' ? 'Welcome back' : 'Create your account'}>
      <div className="mb-4 flex rounded-full bg-stone-100 p-1 text-sm font-semibold">
        {(['in', 'up'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m)
              setError('')
              setNotice('')
            }}
            className={clsx(
              'flex-1 rounded-full py-2 transition',
              mode === m ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500',
            )}
          >
            {m === 'in' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      {!configured && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          <Info size={16} className="mt-0.5 shrink-0" />
          <span>
            You’re in <strong>demo mode</strong>. Connect Supabase (see the README) to enable real
            accounts — for now, just continue as a guest.
          </span>
        </div>
      )}

      <form onSubmit={submit} className="space-y-3">
        {mode === 'up' && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          minLength={6}
          className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {notice && <p className="text-sm text-emerald-600">{notice}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white transition enabled:hover:bg-brand-600 disabled:opacity-50"
        >
          {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      {!configured && (
        <button
          onClick={onClose}
          className="mt-3 w-full rounded-full border border-stone-200 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
        >
          Continue as guest
        </button>
      )}
    </Modal>
  )
}
