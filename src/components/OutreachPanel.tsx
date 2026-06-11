/**
 * OutreachPanel (admin)
 *
 * A multi-channel worklist for inviting unclaimed local venues to claim their
 * Gander listing. "Build list" pulls every imported venue in a town (with its
 * phone, website and — where available — email), and you tap each lead through
 * a status pipeline as you work it by phone, web form or in person.
 *
 * Email sending is optional and only lights up once the separate outreach
 * domain is configured (see OUTREACH.md); the list is fully usable without it.
 *
 * The admin secret is entered once and kept in sessionStorage — sent as the
 * `x-outreach-secret` header, never bundled into the client.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Globe, KeyRound, Loader2, Mail, Phone, Printer, RefreshCw, Send, ShieldCheck, Users } from 'lucide-react'
import clsx from 'clsx'

const SECRET_KEY = 'gander.outreach_secret'

interface Lead {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  website?: string | null
  address?: string | null
  slug?: string
  category?: string
  town?: string
  status: string
  sent_count: number
  last_sent_at?: string
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'pending', label: 'To contact' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'sent', label: 'Emailed' },
  { value: 'interested', label: 'Interested' },
  { value: 'claimed', label: 'Claimed ✓' },
  { value: 'not_interested', label: 'Not interested' },
  { value: 'suppressed', label: 'Do not contact' },
]

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-stone-100 text-stone-600',
  contacted: 'bg-sky-100 text-sky-700',
  sent: 'bg-sky-100 text-sky-700',
  interested: 'bg-amber-100 text-amber-700',
  claimed: 'bg-emerald-100 text-emerald-700',
  not_interested: 'bg-stone-100 text-stone-400',
  suppressed: 'bg-rose-100 text-rose-700',
}

function normaliseUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

export default function OutreachPanel() {
  const [secret, setSecret] = useState<string>(() => sessionStorage.getItem(SECRET_KEY) ?? '')
  const [secretInput, setSecretInput] = useState('')
  const [town, setTown] = useState('Worthing')
  const [batch, setBatch] = useState(12)
  const [leads, setLeads] = useState<Lead[]>([])
  const [busy, setBusy] = useState<'' | 'seed' | 'list' | 'send'>('')
  const [showEmail, setShowEmail] = useState(false)
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

  // Stats computed locally so status edits reflect instantly
  const stats = useMemo(() => {
    const s: Record<string, number> = { total: leads.length }
    for (const l of leads) s[l.status] = (s[l.status] ?? 0) + 1
    return s
  }, [leads])

  const emailable = useMemo(() => leads.filter((l) => l.email && l.status === 'pending').length, [leads])

  async function buildList() {
    setBusy('seed'); setError(''); setMsg('')
    try {
      const data = await call({ action: 'seed', town })
      const added = (data.added as number) ?? 0
      const withEmail = (data.withEmail as number) ?? 0
      setMsg(added > 0
        ? `Added ${added} venue${added === 1 ? '' : 's'} for ${town} (${withEmail} with an email). Work them by phone/website/visit.`
        : (data.message as string) || 'No new venues found.')
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to build list')
    } finally {
      setBusy('')
    }
  }

  async function updateStatus(id: string, status: string) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l))) // optimistic
    try {
      await call({ action: 'setStatus', leadId: id, status })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status')
      void refresh()
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

  function exportCsv() {
    // Mail-merge-ready: includes Town + Listing URL so personalisation tokens
    // (e.g. {{Town}}, {{ListingLink}}) have matching columns in your email tool.
    const origin = (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') || window.location.origin
    const headers = ['Name', 'Email', 'Phone', 'Website', 'Address', 'Town', 'Category', 'Status', 'ListingURL']
    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const body = leads.map((l) =>
      [l.name, l.email, l.phone, l.website, l.address, l.town, l.category, l.status, l.slug ? `${origin}/b/${l.slug}` : '']
        .map(cell)
        .join(','),
    )
    const csv = [headers.map(cell).join(','), ...body].join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `gander-outreach-${town.toLowerCase().replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
            Your call-and-visit worklist for {town}. Build the list, then work each venue by phone, website or in person and tap its status as you go.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            to="/business/flyer"
            target="_blank"
            className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-brand-600"
          >
            <Printer size={13} /> Printable flyer
          </Link>
          <button
            onClick={() => { sessionStorage.removeItem(SECRET_KEY); setSecret(''); setSecretInput('') }}
            className="text-xs font-medium text-stone-400 hover:text-stone-600"
          >
            Lock
          </button>
        </div>
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
          className="flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
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
        {leads.length > 0 && (
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            <Download size={15} /> Export CSV
          </button>
        )}
      </div>

      {msg && <p className="mt-3 text-sm text-emerald-600">{msg}</p>}
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      {/* Stats */}
      {leads.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {(['total', 'pending', 'contacted', 'interested', 'claimed'] as const).map((k) => (
            <div key={k} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-center">
              <p className="font-display text-xl font-semibold text-stone-900">{stats[k] ?? 0}</p>
              <p className="text-[11px] capitalize text-stone-500">{k === 'pending' ? 'to contact' : k}</p>
            </div>
          ))}
        </div>
      )}

      {/* Worklist */}
      {leads.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-400">
              <tr>
                <th className="px-3 py-2 font-semibold">Business</th>
                <th className="px-3 py-2 font-semibold">Contact</th>
                <th className="hidden px-3 py-2 font-semibold md:table-cell">Category</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {leads.map((l) => (
                <tr key={l.id} className="align-top">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-stone-800">{l.name}</p>
                    {l.address && <p className="text-xs text-stone-400">{l.address}</p>}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col gap-1">
                      {l.phone && (
                        <a href={`tel:${l.phone}`} className="flex items-center gap-1.5 text-stone-600 hover:text-brand-600">
                          <Phone size={13} className="shrink-0" /> {l.phone}
                        </a>
                      )}
                      {l.website && (
                        <a href={normaliseUrl(l.website)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-stone-600 hover:text-brand-600">
                          <Globe size={13} className="shrink-0" /> <span className="max-w-[180px] truncate">{l.website.replace(/^https?:\/\//, '')}</span>
                        </a>
                      )}
                      {l.email && (
                        <a href={`mailto:${l.email}`} className="flex items-center gap-1.5 text-stone-600 hover:text-brand-600">
                          <Mail size={13} className="shrink-0" /> <span className="max-w-[180px] truncate">{l.email}</span>
                        </a>
                      )}
                      {!l.phone && !l.website && !l.email && <span className="text-stone-300">—</span>}
                    </div>
                  </td>
                  <td className="hidden px-3 py-2.5 capitalize text-stone-500 md:table-cell">{l.category ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    <select
                      value={l.status}
                      onChange={(e) => updateStatus(l.id, e.target.value)}
                      className={clsx(
                        'cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-semibold outline-none',
                        STATUS_STYLES[l.status] ?? 'bg-stone-100 text-stone-600',
                      )}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value} className="bg-white text-stone-700">
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {leads.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-stone-300 py-8 text-center text-sm text-stone-500">
          No leads yet. Import {town} venues on the OSM panel above, then click <strong>Build list</strong>.
        </p>
      )}

      {/* Optional: automated email (needs the outreach domain) */}
      <div className="mt-5 border-t border-stone-100 pt-4">
        <button
          onClick={() => setShowEmail((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-stone-700"
        >
          <Send size={14} /> Automated email outreach {showEmail ? '▾' : '▸'}
          <span className="font-normal text-stone-400">(optional — needs the outreach domain)</span>
        </button>
        {showEmail && (
          <div className="mt-3">
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
              <ShieldCheck size={15} className="mt-0.5 shrink-0" />
              <p>
                Only emails venues that have an address on file ({emailable} ready). Requires the separate sending domain + env vars from <strong>OUTREACH.md</strong>. Every message carries a one-click opt-out; never re-emails an unsubscribe.
              </p>
            </div>
            <div className="mt-3 flex items-end gap-2">
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
                disabled={busy !== '' || emailable === 0}
                className="flex items-center gap-1.5 rounded-full bg-stone-800 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-900 disabled:opacity-40"
              >
                {busy === 'send' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send next batch
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
