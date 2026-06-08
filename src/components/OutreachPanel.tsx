/**
 * OutreachPanel (admin)
 *
 * Drives the business-outreach engine in api/outreach.ts. Builds a per-town
 * lead list from imported venues that have an email, then sends throttled,
 * opt-out-respecting cold invites via the SEPARATE outreach domain.
 *
 * The admin secret is entered once and kept in sessionStorage — it is sent as
 * the `x-outreach-secret` header and never ends up in the JS bundle.
 */
import { useCallback, useEffect, useState } from 'react'
import { KeyRound, Loader2, Mail, RefreshCw, Send, ShieldCheck, Users } from 'lucide-react'
import clsx from 'clsx'

const SECRET_KEY = 'gander.outreach_secret'

interface Lead {
  id: string
  name: string
  email: string
  slug?: string
  category?: string
  town?: string
  status: string
  sent_count: number
  last_sent_at?: string
}

type Stats = Record<string, number>

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-stone-100 text-stone-600',
  sent: 'bg-sky-100 text-sky-700',
  opened: 'bg-indigo-100 text-indigo-700',
  replied: 'bg-amber-100 text-amber-700',
  claimed: 'bg-emerald-100 text-emerald-700',
  suppressed: 'bg-rose-100 text-rose-700',
  bounced: 'bg-rose-100 text-rose-700',
}

export default function OutreachPanel() {
  const [secret, setSecret] = useState<string>(() => sessionStorage.getItem(SECRET_KEY) ?? '')
  const [secretInput, setSecretInput] = useState('')
  const [town, setTown] = useState('Worthing')
  const [batch, setBatch] = useState(12)
  const [stats, setStats] = useState<Stats | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [busy, setBusy] = useState<'' | 'seed' | 'list' | 'send'>('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const call = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-outreach-secret': secret },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as Record<string, unknown>
      if (!res.ok) throw new Error((data.error as string) || `Request failed (${res.status})`)
      return data
    },
    [secret],
  )

  const refresh = useCallback(async () => {
    if (!secret) return
    setBusy('list'); setError('')
    try {
      const data = await call({ action: 'list', town })
      setStats(data.stats as Stats)
      setLeads((data.leads as Lead[]) ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setBusy('')
    }
  }, [call, secret, town])

  useEffect(() => {
    if (secret) void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret])

  async function buildList() {
    setBusy('seed'); setError(''); setMsg('')
    try {
      const data = await call({ action: 'seed', town })
      setMsg(`Added ${data.added ?? 0} new lead${data.added === 1 ? '' : 's'} for ${town}.${data.message ? ' ' + data.message : ''}`)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to build list')
    } finally {
      setBusy('')
    }
  }

  async function sendBatch() {
    if (!confirm(`Send up to ${batch} cold invites to ${town} businesses now? Each email includes a one-click unsubscribe.`)) return
    setBusy('send'); setError(''); setMsg('')
    try {
      const data = await call({ action: 'send', town, limit: batch })
      setMsg(`Sent ${data.sent ?? 0}, skipped ${data.skipped ?? 0} (suppressed), failed ${data.failures ?? 0}.`)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send')
    } finally {
      setBusy('')
    }
  }

  // --- Secret gate ----------------------------------------------------------
  if (!secret) {
    return (
      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-stone-900">
          <Mail size={18} className="text-brand-500" /> Business outreach
        </h2>
        <p className="mt-0.5 text-sm text-stone-500">
          Enter the outreach admin secret (the <code className="rounded bg-stone-100 px-1">OUTREACH_ADMIN_SECRET</code> you set in Vercel) to unlock.
        </p>
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="password"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              placeholder="Outreach admin secret"
              className="w-full rounded-lg border border-stone-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && secretInput.trim()) {
                  sessionStorage.setItem(SECRET_KEY, secretInput.trim())
                  setSecret(secretInput.trim())
                }
              }}
            />
          </div>
          <button
            onClick={() => { if (secretInput.trim()) { sessionStorage.setItem(SECRET_KEY, secretInput.trim()); setSecret(secretInput.trim()) } }}
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Unlock
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-stone-900">
            <Mail size={18} className="text-brand-500" /> Business outreach
          </h2>
          <p className="mt-0.5 text-sm text-stone-500">
            Invite unclaimed local venues to claim their Gander listing. Sends via your separate outreach domain, with opt-out on every email.
          </p>
        </div>
        <button
          onClick={() => { sessionStorage.removeItem(SECRET_KEY); setSecret(''); setSecretInput('') }}
          className="shrink-0 text-xs font-medium text-stone-400 hover:text-stone-600"
        >
          Lock
        </button>
      </div>

      {/* Compliance reminder */}
      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
        <ShieldCheck size={15} className="mt-0.5 shrink-0" />
        <p>
          Only contact businesses you can lawfully email (UK B2B / corporate subscribers; sole traders need care). Keep volume low, never re-email an opt-out. See <strong>OUTREACH.md</strong>.
        </p>
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-stone-700">Town</span>
          <input
            value={town}
            onChange={(e) => setTown(e.target.value)}
            className="w-40 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
        </label>
        <button
          onClick={buildList}
          disabled={busy !== ''}
          className="flex items-center gap-1.5 rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          {busy === 'seed' ? <Loader2 size={15} className="animate-spin" /> : <Users size={15} />} Build list
        </button>
        <button
          onClick={refresh}
          disabled={busy !== ''}
          className="flex items-center gap-1.5 rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          {busy === 'list' ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Refresh
        </button>

        <div className="ml-auto flex items-end gap-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-stone-700">Batch</span>
            <input
              type="number"
              min={1}
              max={20}
              value={batch}
              onChange={(e) => setBatch(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
              className="w-20 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </label>
          <button
            onClick={sendBatch}
            disabled={busy !== '' || !stats?.pending}
            className="flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-40"
          >
            {busy === 'send' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send next batch
          </button>
        </div>
      </div>

      {msg && <p className="mt-3 text-sm text-emerald-600">{msg}</p>}
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      {/* Stats */}
      {stats && (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {(['total', 'pending', 'sent', 'replied', 'claimed', 'suppressed'] as const).map((k) => (
            <div key={k} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-center">
              <p className="font-display text-xl font-semibold text-stone-900">{stats[k] ?? 0}</p>
              <p className="text-[11px] capitalize text-stone-500">{k}</p>
            </div>
          ))}
        </div>
      )}

      {/* Lead table */}
      {leads.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-stone-200">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-400">
              <tr>
                <th className="px-3 py-2 font-semibold">Business</th>
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="hidden px-3 py-2 font-semibold sm:table-cell">Category</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {leads.map((l) => (
                <tr key={l.id}>
                  <td className="px-3 py-2 font-medium text-stone-800">{l.name}</td>
                  <td className="px-3 py-2 text-stone-500">{l.email}</td>
                  <td className="hidden px-3 py-2 capitalize text-stone-500 sm:table-cell">{l.category ?? '—'}</td>
                  <td className="px-3 py-2">
                    <span className={clsx('rounded-full px-2 py-0.5 text-xs font-semibold', STATUS_STYLES[l.status] ?? 'bg-stone-100 text-stone-600')}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {stats && stats.total === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-stone-300 py-8 text-center text-sm text-stone-500">
          No leads yet. Import {town} venues (with emails) on the OSM panel above, then click <strong>Build list</strong>.
        </p>
      )}
    </section>
  )
}
