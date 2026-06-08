import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  CalendarCheck,
  Check,
  CheckCircle2,
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
  Wallet,
  X,
  XCircle,
} from 'lucide-react'
import clsx from 'clsx'
import { businesses, businessesById } from '../data/businesses'
import { useStore } from '../store/StoreContext'
import { useAuth } from '../auth/AuthContext'
import type { Business, Review } from '../data/types'
import { discountPct, formatPrice } from '../lib/format'
import * as db from '../lib/db'
import type { StaffMember, DayHours, BusinessBooking } from '../lib/db'
import { uploadImage, storageEnabled } from '../lib/storage'
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

// ---- Bookings tab ----------------------------------------------------------

function BookingsTab({ business }: { business: Business }) {
  const { configured } = useAuth()
  const [bookings, setBookings] = useState<BusinessBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    if (!configured || !db.backendEnabled) { setLoading(false); return }
    setLoading(true)
    db.listBusinessBookings(business.id)
      .then(setBookings)
      .catch((e: unknown) => {
        const msg =
          e instanceof Error ? e.message
          : typeof e === 'object' && e !== null && 'message' in e
          ? String((e as { message: unknown }).message)
          : String(e)
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [business.id, configured])

  useEffect(() => { load() }, [load])

  async function handleStatus(id: string, status: 'confirmed' | 'cancelled') {
    setBusyId(id)
    try {
      await db.updateBookingStatus(id, status)
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId(null)
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = bookings.filter((b) => b.date >= today && b.status !== 'cancelled')
  const past = bookings.filter((b) => b.date < today || b.status === 'cancelled')

  if (!configured || !db.backendEnabled) {
    return (
      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
        Connect Supabase to view bookings.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mt-6 flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-stone-400" />
      </div>
    )
  }

  function BookingRow({ b }: { b: BusinessBooking }) {
    const isPast = b.date < today
    const isCancelled = b.status === 'cancelled'
    return (
      <div className={clsx(
        'flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3',
        isCancelled ? 'border-stone-100 bg-stone-50 opacity-60' : 'border-stone-200 bg-white',
      )}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-stone-900">{b.customerName}</span>
            <span className={clsx(
              'rounded-full px-2 py-0.5 text-xs font-semibold',
              b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700'
              : b.status === 'cancelled' ? 'bg-stone-100 text-stone-500'
              : 'bg-amber-100 text-amber-700',
            )}>
              {b.status}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-stone-500">
            {b.date} at {b.time} · {b.partySize} {b.partySize === 1 ? 'person' : 'people'}
            {b.occasion ? ` · ${b.occasion}` : ''}
          </p>
        </div>
        {!isPast && !isCancelled && (
          <div className="flex items-center gap-2">
            {b.status !== 'confirmed' && (
              <button
                disabled={busyId === b.id}
                onClick={() => handleStatus(b.id, 'confirmed')}
                className="flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
              >
                {busyId === b.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                Confirm
              </button>
            )}
            <button
              disabled={busyId === b.id}
              onClick={() => handleStatus(b.id, 'cancelled')}
              className="flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40"
            >
              {busyId === b.id ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
              Cancel
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-6">
      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
      )}

      {/* Upcoming */}
      <section>
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-stone-900">
          <CalendarCheck size={18} className="text-brand-500" />
          Upcoming
          {upcoming.length > 0 && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
              {upcoming.length}
            </span>
          )}
        </h2>
        <div className="mt-3 space-y-2">
          {upcoming.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-200 p-8 text-center text-sm text-stone-400">
              No upcoming bookings. They'll appear here as customers book via Gander.
            </p>
          ) : (
            upcoming.map((b) => <BookingRow key={b.id} b={b} />)
          )}
        </div>
      </section>

      {/* Past / cancelled */}
      {past.length > 0 && (
        <section>
          <h2 className="font-display text-base font-semibold text-stone-500">
            Past &amp; cancelled
          </h2>
          <div className="mt-3 space-y-2">
            {past.slice(0, 10).map((b) => <BookingRow key={b.id} b={b} />)}
            {past.length > 10 && (
              <p className="text-center text-xs text-stone-400">
                Showing 10 of {past.length} past bookings
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

// ---- Edit listing tab ------------------------------------------------------

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const DEFAULT_HOURS: Record<string, DayHours> = Object.fromEntries(
  DAYS.map((d) => [d, { open: '09:00', close: '22:00', closed: d === 'Sunday' }]),
)

function HoursEditor({
  hours, onChange,
}: {
  hours: Record<string, DayHours>
  onChange: (h: Record<string, DayHours>) => void
}) {
  function update(day: string, field: keyof DayHours, value: string | boolean) {
    onChange({ ...hours, [day]: { ...hours[day], [field]: value } })
  }

  return (
    <div className="divide-y divide-stone-100">
      {DAYS.map((day) => {
        const h = hours[day] ?? { open: '09:00', close: '22:00', closed: false }
        const isToday = new Date().toLocaleDateString('en-GB', { weekday: 'long' }) === day
        return (
          <div key={day} className={`flex items-center gap-3 py-2.5 ${isToday ? 'font-semibold' : ''}`}>
            <span className="w-24 shrink-0 text-sm text-stone-700">
              {day.slice(0, 3)}{isToday && <span className="ml-1 text-xs font-normal text-brand-500">today</span>}
            </span>
            <label className="flex items-center gap-1.5 text-sm text-stone-500">
              <input
                type="checkbox"
                checked={!h.closed}
                onChange={(e) => update(day, 'closed', !e.target.checked)}
                className="accent-brand-500"
              />
              Open
            </label>
            {!h.closed ? (
              <>
                <input
                  type="time"
                  value={h.open}
                  onChange={(e) => update(day, 'open', e.target.value)}
                  className="rounded-lg border border-stone-200 px-2 py-1 text-sm outline-none focus:border-brand-400"
                />
                <span className="text-xs text-stone-400">to</span>
                <input
                  type="time"
                  value={h.close}
                  onChange={(e) => update(day, 'close', e.target.value)}
                  className="rounded-lg border border-stone-200 px-2 py-1 text-sm outline-none focus:border-brand-400"
                />
              </>
            ) : (
              <span className="text-sm text-stone-400">Closed</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

const COMMON_AMENITIES = [
  'Free Wi-Fi', 'Outdoor seating', 'Private dining', 'Accessible', 'Dog friendly',
  'Late night', 'Live music', 'Parking', 'Takeaway', 'BYO', 'Reservations',
]

function PhotoSlot({
  src, label, onUpload, onRemove, uploading,
}: {
  src?: string; label: string; onUpload: (f: File) => void
  onRemove?: () => void; uploading?: boolean
}) {
  return (
    <div className="relative">
      <label className="group block cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-stone-200 hover:border-brand-400">
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f) }} />
        {src ? (
          <img src={src} alt={label} className="h-full w-full object-cover" style={{ minHeight: 80 }} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 py-5 text-stone-400 group-hover:text-brand-500" style={{ minHeight: 80 }}>
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
            <span className="text-xs font-medium">{uploading ? 'Uploading…' : label}</span>
          </div>
        )}
      </label>
      {src && onRemove && (
        <button onClick={onRemove} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80">
          <X size={12} />
        </button>
      )}
    </div>
  )
}

function EditListingTab({ business }: { business: Business }) {
  const { configured } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState(business.name)
  const [shortDesc, setShortDesc] = useState(business.shortDescription)
  const [desc, setDesc] = useState(business.description)
  const [phone, setPhone] = useState(business.phone ?? '')
  const [website, setWebsite] = useState(business.website ?? '')
  const [address, setAddress] = useState(business.address ?? '')
  const [postcode, setPostcode] = useState(business.postcode ?? '')
  const [heroUrl, setHeroUrl] = useState(business.heroImage ?? '')
  const [gallery, setGallery] = useState<string[]>(business.images ?? [])
  const [amenities, setAmenities] = useState<string[]>(business.amenities ?? [])
  const [hours, setHours] = useState<Record<string, DayHours>>(DEFAULT_HOURS)

  // Load saved profile
  useEffect(() => {
    if (!configured || !db.backendEnabled) { setLoading(false); return }
    db.getBusinessProfile(business.id)
      .then((p) => {
        if (p) {
          if (p.name) setName(p.name)
          if (p.shortDescription) setShortDesc(p.shortDescription)
          if (p.description) setDesc(p.description)
          if (p.phone) setPhone(p.phone)
          if (p.website) setWebsite(p.website)
          if (p.address) setAddress(p.address)
          if (p.postcode) setPostcode(p.postcode)
          if (p.heroImageUrl) setHeroUrl(p.heroImageUrl)
          if (p.galleryUrls.length) setGallery(p.galleryUrls)
          if (p.amenities.length) setAmenities(p.amenities)
          if (p.hours) setHours(p.hours)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [business.id, configured])

  async function uploadPhoto(slot: string, file: File): Promise<string | null> {
    if (!storageEnabled) return URL.createObjectURL(file)
    setUploadingSlot(slot)
    try {
      return await uploadImage(file, `business/${business.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
      return null
    } finally {
      setUploadingSlot(null)
    }
  }

  async function handleSave() {
    if (!configured || !db.backendEnabled) { setError('Connect Supabase to save changes.'); return }
    setSaving(true); setError(''); setSaved(false)
    try {
      await db.saveBusinessProfile(business.id, {
        name, shortDescription: shortDesc, description: desc,
        phone, website, address, postcode,
        heroImageUrl: heroUrl, galleryUrls: gallery, amenities, hours,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function toggleAmenity(a: string) {
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])
  }

  if (loading) return (
    <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-stone-400" /></div>
  )

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
      {/* Left: photos + text */}
      <div className="space-y-6">
        {/* Photos */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-stone-900">
            Photos
          </h2>
          <p className="mt-0.5 text-sm text-stone-500">
            The first photo is your hero image — it appears at the top of your listing.
            {!storageEnabled && <span className="ml-1 text-amber-600">Connect Supabase to enable uploads.</span>}
          </p>
          {/* Hero */}
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">Hero image</p>
            <div className="h-40 overflow-hidden rounded-xl">
              <PhotoSlot
                src={heroUrl || undefined}
                label="Upload hero photo"
                uploading={uploadingSlot === 'hero'}
                onUpload={async (f) => { const u = await uploadPhoto('hero', f); if (u) setHeroUrl(u) }}
                onRemove={() => setHeroUrl('')}
              />
            </div>
          </div>
          {/* Gallery */}
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">Gallery (up to 8)</p>
            <div className="grid grid-cols-4 gap-2">
              {gallery.map((url, i) => (
                <PhotoSlot
                  key={url + i}
                  src={url}
                  label=""
                  uploading={uploadingSlot === `gallery-${i}`}
                  onUpload={async (f) => { const u = await uploadPhoto(`gallery-${i}`, f); if (u) setGallery((g) => g.map((x, j) => j === i ? u : x)) }}
                  onRemove={() => setGallery((g) => g.filter((_, j) => j !== i))}
                />
              ))}
              {gallery.length < 8 && (
                <PhotoSlot
                  label="Add photo"
                  uploading={uploadingSlot === 'gallery-new'}
                  onUpload={async (f) => { const u = await uploadPhoto('gallery-new', f); if (u) setGallery((g) => [...g, u]) }}
                />
              )}
            </div>
          </div>
        </section>

        {/* Opening hours */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-stone-900">Opening hours</h2>
          <p className="mt-0.5 text-sm text-stone-500">Set your weekly schedule. Customers see this on your public page.</p>
          <div className="mt-3">
            <HoursEditor hours={hours} onChange={setHours} />
          </div>
        </section>

        {/* Details */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-stone-900">Listing details</h2>
          <div className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-stone-700">Business name</span>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-stone-700">Tagline <span className="font-normal text-stone-400">(shown in cards)</span></span>
              <input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} maxLength={120}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-stone-700">Full description</span>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={5}
                className="w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-stone-700">Phone</span>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-stone-700">Website</span>
                <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
              </label>
            </div>
            <div className="grid grid-cols-[1fr_8rem] gap-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-stone-700">Address</span>
                <input value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-stone-700">Postcode</span>
                <input value={postcode} onChange={(e) => setPostcode(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* Right: amenities + save */}
      <aside className="space-y-4">
        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <h3 className="font-semibold text-stone-900">Amenities</h3>
          <p className="mt-0.5 text-xs text-stone-500">Tick everything that applies.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {COMMON_AMENITIES.map((a) => (
              <button
                key={a}
                onClick={() => toggleAmenity(a)}
                className={clsx(
                  'rounded-full border px-3 py-1 text-xs font-medium transition',
                  amenities.includes(a)
                    ? 'border-brand-300 bg-brand-50 text-brand-700'
                    : 'border-stone-200 text-stone-600 hover:border-stone-300',
                )}
              >
                {a}
              </button>
            ))}
          </div>
          {/* Custom amenity */}
          <div className="mt-3 flex gap-2">
            <input
              placeholder="Add custom…"
              className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs outline-none focus:border-brand-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = (e.target as HTMLInputElement).value.trim()
                  if (v && !amenities.includes(v)) { setAmenities((p) => [...p, v]);(e.target as HTMLInputElement).value = '' }
                }
              }}
            />
            <span className="text-xs text-stone-400 self-center">↵ Enter</span>
          </div>
        </section>

        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
          {saved && (
            <p className="mb-3 flex items-center gap-1.5 text-sm text-emerald-600">
              <Check size={14} /> Saved! Changes are live on your public page.
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !configured}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-40"
          >
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : 'Save changes'}
          </button>
          <p className="mt-2 text-center text-xs text-stone-400">
            Changes appear immediately on your public listing.
          </p>
        </div>
      </aside>
    </div>
  )
}

// ---- Stripe Connect panel --------------------------------------------------

function StripeConnectPanel({ businessId }: { businessId: string }) {
  const { configured } = useAuth()
  const [accountId, setAccountId] = useState<string | null | undefined>(undefined)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!configured || !db.backendEnabled) { setAccountId(null); return }
    db.getMerchantStripeAccount(businessId).then(setAccountId).catch(() => setAccountId(null))
  }, [businessId, configured])

  async function handleConnect() {
    setConnecting(true)
    setError('')
    try {
      const res = await fetch('/api/stripe-connect-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      })
      const json = await res.json() as { url?: string; error?: string }
      if (json.error) { setError(json.error); setConnecting(false); return }
      if (json.url) window.location.href = json.url
    } catch {
      setError('Could not reach the server.')
      setConnecting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <h3 className="flex items-center gap-1.5 font-semibold text-stone-900">
        <Wallet size={16} className="text-brand-500" /> Payouts
      </h3>

      {accountId === undefined && (
        <div className="mt-2 flex justify-center py-3">
          <Loader2 size={16} className="animate-spin text-stone-400" />
        </div>
      )}

      {accountId === null && (
        <>
          <p className="mt-1 text-xs text-stone-500">
            Connect Stripe to receive automatic payouts when customers buy your deals.
            Gander keeps a <span className="font-semibold">15% platform fee</span> — the rest goes to your bank account.
          </p>
          {!configured && (
            <p className="mt-2 text-xs text-amber-600">Connect Supabase to enable payouts.</p>
          )}
          {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
          <button
            onClick={handleConnect}
            disabled={connecting || !configured}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#635BFF] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
          >
            {connecting ? <Loader2 size={14} className="animate-spin" /> : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
              </svg>
            )}
            Connect with Stripe
          </button>
        </>
      )}

      {accountId && (
        <div className="mt-2 flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-stone-900">Stripe connected</p>
            <p className="truncate font-mono text-xs text-stone-400">{accountId}</p>
          </div>
        </div>
      )}
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
    ownedBusinesses,
    liveBusinesses,
  } = useStore()

  // If the user has real owned businesses prefer those, otherwise show seed data
  const manageableBusinesses = ownedBusinesses.length > 0 ? ownedBusinesses : businesses

  // Auto-switch to the user's first owned business if we're still on a seed default
  useEffect(() => {
    if (ownedBusinesses.length > 0 && !ownedBusinesses.find((b) => b.id === managedBusinessId)) {
      setManagedBusiness(ownedBusinesses[0].id)
    }
  }, [ownedBusinesses, managedBusinessId, setManagedBusiness])

  // Look up in seed data first, then live businesses
  const business =
    businessesById[managedBusinessId] ??
    liveBusinesses.find((b) => b.id === managedBusinessId) ??
    (ownedBusinesses[0] ?? businesses[0])
  const stats = statsFor(business)
  const reviews = reviewsFor(business.id)
  const venueDeals = dealsForBusinessId(business.id)
  const venueBookings = bookings.filter(
    (b) => b.businessId === business.id && b.status === 'confirmed',
  ).length

  const views = stats.reviewCount * 37 + 1840
  const saves = Math.round(stats.reviewCount * 0.9)

  const [showScanner, setShowScanner] = useState(false)
  const [dashTab, setDashTab] = useState<'overview' | 'bookings' | 'edit'>('overview')

  // Avg spend from real voucher data
  const [voucherStats, setVoucherStats] = useState<{ count: number; avgSpend: number | null; totalRevenue: number } | null>(null)
  useEffect(() => {
    if (db.backendEnabled) {
      db.getBusinessVoucherStats(business.id).then(setVoucherStats).catch(console.error)
    }
  }, [business.id])

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
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ownedBusinesses.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
              {ownedBusinesses.length > 0 ? 'Owned' : 'Demo'}
            </span>
          </div>
          <p className="text-sm text-stone-500">
            {business.neighbourhood} · {business.address}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {manageableBusinesses.length > 1 && (
            <select
              value={managedBusinessId}
              onChange={(e) => setManagedBusiness(e.target.value)}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-brand-400"
              title="Switch venue"
            >
              {manageableBusinesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <Link
            to={`/b/${business.slug}`}
            className="flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            <ExternalLink size={14} /> View
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Star} label="Rating" value={stats.rating.toFixed(1)} hint="Top 10% locally" />
        <StatCard icon={MessageSquare} label="Reviews" value={stats.reviewCount.toLocaleString('en-GB')} />
        <StatCard icon={Eye} label="Profile views" value={views.toLocaleString('en-GB')} hint="+12% this week" />
        <StatCard icon={Heart} label="Saves" value={saves.toLocaleString('en-GB')} />
        <StatCard icon={CalendarCheck} label="Bookings" value={venueBookings} hint="via Gander" />
        <StatCard
          icon={Wallet}
          label="Avg spend"
          value={voucherStats?.avgSpend != null ? formatPrice(voucherStats.avgSpend) : '—'}
          hint={voucherStats && voucherStats.count > 0 ? `${voucherStats.count} vouchers sold` : 'No vouchers yet'}
        />
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-stone-200">
        {(['overview', 'bookings', 'edit'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setDashTab(t)}
            className={clsx(
              'relative flex items-center gap-1.5 px-4 py-3 text-sm font-semibold capitalize transition',
              dashTab === t ? 'text-brand-600' : 'text-stone-500 hover:text-stone-800',
            )}
          >
            {t === 'edit' ? 'Edit listing' : t === 'bookings' ? 'Bookings' : 'Overview'}
            {t === 'bookings' && venueBookings > 0 && (
              <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                {venueBookings}
              </span>
            )}
            {dashTab === t && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-500" />
            )}
          </button>
        ))}
      </div>

      {dashTab === 'overview' && (
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

          {/* Deals manager + payouts + staff */}
          <aside className="space-y-4">
            <DealCreator business={business} />
            <StripeConnectPanel businessId={business.id} />
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
      )}

      {dashTab === 'bookings' && (
        <BookingsTab business={business} />
      )}

      {dashTab === 'edit' && (
        <EditListingTab business={business} />
      )}
    </div>
  )
}
