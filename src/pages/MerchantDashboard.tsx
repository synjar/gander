import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  CalendarCheck,
  Check,
  ExternalLink,
  Eye,
  Heart,
  Loader2,
  MessageSquare,
  Plus,
  QrCode,
  Star,
  Tag,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { businesses, businessesById } from '../data/businesses'
import { useStore } from '../store/StoreContext'
import { useAuth } from '../auth/AuthContext'
import type { Business, Review } from '../data/types'
import { discountPct, formatPrice } from '../lib/format'
import * as db from '../lib/db'
import type { StaffMember } from '../lib/db'
import Avatar from '../components/Avatar'
import Stars from '../components/Stars'
import SmartImage from '../components/SmartImage'
import ScanAndRedeem from '../components/ScanAndRedeem'

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Star
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex items-center gap-2 text-stone-500">
        <Icon size={16} className="text-brand-500" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold text-stone-900">{value}</p>
      {hint && <p className="text-xs text-emerald-600">{hint}</p>}
    </div>
  )
}

function ReviewResponder({ review }: { review: Review }) {
  const { responseFor, respondToReview } = useStore()
  const existing = responseFor(review.id)
  const [text, setText] = useState(existing?.text ?? '')
  const [open, setOpen] = useState(false)
  const justSaved = existing && existing.text === text.trim()

  return (
    <div className="border-b border-stone-100 py-4 last:border-0">
      <div className="flex items-center gap-3">
        <Avatar name={review.authorName} src={review.authorAvatar} size={36} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-900">{review.authorName}</p>
          <div className="flex items-center gap-2">
            <Stars value={review.rating} size={13} />
            <span className="text-xs text-stone-400">{review.date}</span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm text-stone-600">{review.body}</p>

      {existing && !open ? (
        <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
          <p className="text-xs font-semibold text-stone-700">Your response</p>
          <p className="mt-1 text-sm text-stone-600">{existing.text}</p>
          <button
            onClick={() => setOpen(true)}
            className="mt-2 text-xs font-semibold text-brand-600 hover:underline"
          >
            Edit response
          </button>
        </div>
      ) : (
        <div className="mt-3">
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              <MessageSquare size={13} /> Respond
            </button>
          ) : (
            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="Thank the reviewer or address their feedback…"
                className="w-full resize-none rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    respondToReview(review.id, text.trim())
                    setOpen(false)
                  }}
                  disabled={text.trim().length < 2}
                  className="rounded-full bg-brand-500 px-4 py-1.5 text-xs font-semibold text-white transition enabled:hover:bg-brand-600 disabled:opacity-40"
                >
                  {existing ? 'Update response' : 'Post response'}
                </button>
                <button
                  onClick={() => {
                    setText(existing?.text ?? '')
                    setOpen(false)
                  }}
                  className="text-xs font-medium text-stone-500 hover:text-stone-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {justSaved && !open && (
        <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
          <Check size={12} /> Response published — it’s now visible on your public page.
        </p>
      )}
    </div>
  )
}

function DealCreator({ business }: { business: Business }) {
  const { addMerchantDeal } = useStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [orig, setOrig] = useState('')
  const [price, setPrice] = useState('')
  const [tag, setTag] = useState('')
  const [done, setDone] = useState(false)

  const o = Number(orig)
  const p = Number(price)
  const canSubmit = title.trim().length > 2 && o > 0 && p > 0 && p < o

  function submit() {
    addMerchantDeal({
      businessId: business.id,
      title: title.trim(),
      description: description.trim() || 'A limited-time offer from ' + business.name + '.',
      originalPrice: o,
      dealPrice: p,
      tag: tag.trim() || undefined,
    })
    setTitle('')
    setDescription('')
    setOrig('')
    setPrice('')
    setTag('')
    setDone(true)
    window.setTimeout(() => setDone(false), 3500)
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <h3 className="flex items-center gap-1.5 font-semibold text-stone-900">
        <Plus size={16} className="text-brand-500" /> Create a deal
      </h3>
      <div className="mt-3 space-y-2.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Deal title (e.g. 2-course lunch for two)"
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What's included?"
          className="w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
        <div className="grid grid-cols-3 gap-2">
          <label className="text-xs text-stone-500">
            Was (£)
            <input
              type="number"
              value={orig}
              onChange={(e) => setOrig(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm outline-none focus:border-brand-400"
            />
          </label>
          <label className="text-xs text-stone-500">
            Now (£)
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm outline-none focus:border-brand-400"
            />
          </label>
          <label className="text-xs text-stone-500">
            Tag
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Lunch"
              className="mt-1 w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm outline-none focus:border-brand-400"
            />
          </label>
        </div>
        {o > 0 && p > 0 && p < o && (
          <p className="text-xs text-emerald-600">
            That’s {discountPct(o, p)}% off — customers love a deal over 30%.
          </p>
        )}
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="w-full rounded-full bg-brand-500 py-2.5 text-sm font-semibold text-white transition enabled:hover:bg-brand-600 disabled:opacity-40"
        >
          Publish deal
        </button>
        {done && (
          <p className="flex items-center justify-center gap-1 text-xs text-emerald-600">
            <Check size={13} /> Deal published — it’s live on Gander now.
          </p>
        )}
      </div>
    </div>
  )
}

// ---- Staff manager panel ---------------------------------------------------

function StaffManager({ businessId, businessName }: { businessId: string; businessName: string }) {
  const { configured } = useAuth()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [addBusy, setAddBusy] = useState(false)
  const [addError, setAddError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(() => {
    if (!configured || !db.backendEnabled) return
    setLoading(true)
    db.listStaff(businessId)
      .then(setStaff)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [businessId, configured])

  useEffect(() => { load() }, [load])

  async function handleAdd() {
    if (!newEmail.trim() || !newName.trim()) return
    setAddBusy(true)
    setAddError('')
    try {
      await db.addStaffMember(businessId, businessName, newEmail.trim().toLowerCase(), newName.trim())
      setNewEmail('')
      setNewName('')
      setShowForm(false)
      load()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : String(err))
    } finally {
      setAddBusy(false)
    }
  }

  async function handleRemove(id: string) {
    await db.removeStaffMember(id).catch(console.error)
    load()
  }

  const staffLink = `${window.location.origin}/staff/scan`

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 font-semibold text-stone-900">
          <Users size={16} className="text-brand-500" /> Staff access
          {staff.length > 0 && (
            <span className="ml-1 rounded-full bg-stone-100 px-1.5 py-0.5 text-xs text-stone-500">
              {staff.length}
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1 rounded-full border border-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
        >
          <UserPlus size={13} /> Add
        </button>
      </div>

      <p className="mt-1 text-xs text-stone-500">
        Staff can scan vouchers at{' '}
        <a href={staffLink} target="_blank" rel="noreferrer" className="font-mono text-brand-600 hover:underline">
          /staff/scan
        </a>
      </p>

      {!configured && (
        <p className="mt-2 text-xs text-amber-600">Connect Supabase to enable staff accounts.</p>
      )}

      {showForm && (
        <div className="mt-3 space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Staff name (e.g. Jordan)"
            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Their email address"
            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          {addError && <p className="text-xs text-rose-600">{addError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={addBusy || !newEmail.trim() || !newName.trim()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-500 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-40"
            >
              {addBusy ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
              Add staff member
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-full border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="mt-3 flex justify-center py-4">
          <Loader2 size={18} className="animate-spin text-stone-400" />
        </div>
      ) : staff.length === 0 ? (
        <p className="mt-3 text-xs text-stone-400">
          No staff added yet. Add a team member so they can scan vouchers on their phone.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-stone-100">
          {staff.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-2">
              <Avatar name={s.name} size={28} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-900">{s.name}</p>
                <p className="truncate text-xs text-stone-400">{s.email}</p>
              </div>
              <button
                onClick={() => handleRemove(s.id)}
                className="rounded-full p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-500"
                title="Remove staff member"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---- Main dashboard --------------------------------------------------------

export default function MerchantDashboard() {
  const {
    managedBusinessId,
    setManagedBusiness,
    statsFor,
    reviewsFor,
    dealsForBusinessId,
    bookings,
    merchantDeals,
  } = useStore()
  const business = businessesById[managedBusinessId] ?? businesses[0]
  const stats = statsFor(business)
  const reviews = reviewsFor(business.id)
  const venueDeals = dealsForBusinessId(business.id)
  const venueBookings = bookings.filter(
    (b) => b.businessId === business.id && b.status === 'confirmed',
  ).length

  const views = stats.reviewCount * 37 + 1840
  const saves = Math.round(stats.reviewCount * 0.9)

  const [showScanner, setShowScanner] = useState(false)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <BarChart3 size={18} className="text-brand-500" />
          <span className="font-semibold text-stone-900">Owner dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
          >
            <QrCode size={15} /> Scan voucher
          </button>
          <Link to="/business" className="text-sm font-medium text-brand-600 hover:underline">
            ← For-business home
          </Link>
        </div>
      </div>

      {/* Scanner modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-stone-500">{business.name}</span>
              <button
                onClick={() => setShowScanner(false)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100"
              >
                <X size={18} />
              </button>
            </div>
            <ScanAndRedeem businessId={business.id} title="Scan customer voucher" />
          </div>
        </div>
      )}


      {/* Venue header */}
      <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center">
        <SmartImage
          src={business.heroImage}
          seedFallback={business.id}
          className="h-20 w-28 shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-semibold text-stone-900">{business.name}</h1>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Claimed
            </span>
          </div>
          <p className="text-sm text-stone-500">
            {business.neighbourhood} · {business.address}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={managedBusinessId}
            onChange={(e) => setManagedBusiness(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-brand-400"
            title="Switch venue (demo)"
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <Link
            to={`/b/${business.slug}`}
            className="flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            <ExternalLink size={14} /> View
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={Star} label="Rating" value={stats.rating.toFixed(1)} hint="Top 10% locally" />
        <StatCard icon={MessageSquare} label="Reviews" value={stats.reviewCount.toLocaleString('en-GB')} />
        <StatCard icon={Eye} label="Profile views" value={views.toLocaleString('en-GB')} hint="+12% this week" />
        <StatCard icon={Heart} label="Saves" value={saves.toLocaleString('en-GB')} />
        <StatCard icon={CalendarCheck} label="Bookings" value={venueBookings} hint="via Gander" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* Reviews inbox */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-stone-900">
            <MessageSquare size={18} className="text-brand-500" /> Reviews inbox
          </h2>
          <p className="mt-0.5 text-sm text-stone-500">
            Respond to customers — your replies show publicly under each review.
          </p>
          <div className="mt-2">
            {reviews.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-500">No reviews yet.</p>
            ) : (
              reviews.map((r) => <ReviewResponder key={r.id} review={r} />)
            )}
          </div>
        </section>

        {/* Deals manager + staff */}
        <aside className="space-y-4">
          <DealCreator business={business} />
          <StaffManager businessId={business.id} businessName={business.name} />
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <h3 className="flex items-center gap-1.5 font-semibold text-stone-900">
              <Tag size={16} className="text-brand-500" /> Live deals ({venueDeals.length})
            </h3>
            <div className="mt-3 space-y-2">
              {venueDeals.length === 0 ? (
                <p className="text-sm text-stone-500">No deals yet. Create one to attract customers.</p>
              ) : (
                venueDeals.map((d) => (
                  <div
                    key={d.id}
                    className={clsx(
                      'rounded-xl border p-3',
                      merchantDeals.some((m) => m.id === d.id)
                        ? 'border-brand-200 bg-brand-50/50'
                        : 'border-stone-200',
                    )}
                  >
                    <p className="text-sm font-semibold text-stone-900">{d.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <span className="font-bold text-brand-600">{formatPrice(d.dealPrice)}</span>
                      <span className="text-stone-400 line-through">{formatPrice(d.originalPrice)}</span>
                      <span className="text-xs text-stone-400">· {d.sold.toLocaleString('en-GB')} sold</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
