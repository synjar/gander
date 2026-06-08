import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Building2,
  CalendarCheck,
  Check,
  CheckCircle2,
  Loader2,
  MapPin,
} from 'lucide-react'
import clsx from 'clsx'
import { categories } from '../data/categories'
import { cities } from '../data/cities'
import { useAuth } from '../auth/AuthContext'
import * as db from '../lib/db'
import type { CategoryId } from '../data/types'

const STEPS = ['Your business', 'Tell your story', 'Contact & submit'] as const

interface FormState {
  // step 1
  name: string
  category: CategoryId | ''
  cityId: string
  neighbourhood: string
  address: string
  postcode: string
  // step 2
  shortDescription: string
  description: string
  priceLevel: 1 | 2 | 3 | 4
  phone: string
  website: string
  bookable: boolean
  delivers: boolean
  // step 3
  contactEmail: string
  agreed: boolean
}

const EMPTY: FormState = {
  name: '',
  category: '',
  cityId: 'london',
  neighbourhood: '',
  address: '',
  postcode: '',
  shortDescription: '',
  description: '',
  priceLevel: 2,
  phone: '',
  website: '',
  bookable: false,
  delivers: false,
  contactEmail: '',
  agreed: false,
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-stone-700">{children}</label>
}

const inputCls =
  'mt-1 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

function Step1({ f, set }: { f: FormState; set: (p: Partial<FormState>) => void }) {
  const city = cities.find((c) => c.id === f.cityId)

  return (
    <div className="space-y-4">
      <FieldLabel>
        Business name <span className="text-red-400">*</span>
        <input
          value={f.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g. The Copper Whisk"
          className={inputCls}
        />
      </FieldLabel>

      <FieldLabel>
        Category <span className="text-red-400">*</span>
        <select
          value={f.category}
          onChange={(e) => set({ category: e.target.value as CategoryId })}
          className={inputCls}
        >
          <option value="">Select a category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
      </FieldLabel>

      <div className="grid grid-cols-2 gap-4">
        <FieldLabel>
          City <span className="text-red-400">*</span>
          <select
            value={f.cityId}
            onChange={(e) => set({ cityId: e.target.value, neighbourhood: '' })}
            className={inputCls}
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FieldLabel>

        <FieldLabel>
          Neighbourhood <span className="text-red-400">*</span>
          {city && city.neighbourhoods.length > 0 ? (
            <select
              value={f.neighbourhood}
              onChange={(e) => set({ neighbourhood: e.target.value })}
              className={inputCls}
            >
              <option value="">Select…</option>
              {city.neighbourhoods.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={f.neighbourhood}
              onChange={(e) => set({ neighbourhood: e.target.value })}
              placeholder="e.g. Shoreditch"
              className={inputCls}
            />
          )}
        </FieldLabel>
      </div>

      <FieldLabel>
        Address <span className="text-red-400">*</span>
        <input
          value={f.address}
          onChange={(e) => set({ address: e.target.value })}
          placeholder="e.g. 14 Brick Lane"
          className={inputCls}
        />
      </FieldLabel>

      <FieldLabel>
        Postcode <span className="text-red-400">*</span>
        <input
          value={f.postcode}
          onChange={(e) => set({ postcode: e.target.value.toUpperCase() })}
          placeholder="e.g. E1 6RF"
          className={inputCls}
        />
      </FieldLabel>
    </div>
  )
}

function Step2({ f, set }: { f: FormState; set: (p: Partial<FormState>) => void }) {
  return (
    <div className="space-y-4">
      <FieldLabel>
        One-line description <span className="text-red-400">*</span>
        <div className="relative">
          <input
            value={f.shortDescription}
            onChange={(e) => set({ shortDescription: e.target.value.slice(0, 120) })}
            placeholder="A cosy neighbourhood bistro with a focus on seasonal British produce."
            className={inputCls}
          />
          <span className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-xs text-stone-400">
            {f.shortDescription.length}/120
          </span>
        </div>
      </FieldLabel>

      <FieldLabel>
        Full description <span className="text-red-400">*</span>
        <textarea
          value={f.description}
          onChange={(e) => set({ description: e.target.value })}
          rows={4}
          placeholder="Tell customers what makes your place special — your story, your food, your vibe."
          className={inputCls + ' resize-none'}
        />
      </FieldLabel>

      <div>
        <p className="text-sm font-medium text-stone-700">Price range</p>
        <div className="mt-2 flex gap-2">
          {([1, 2, 3, 4] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => set({ priceLevel: p })}
              className={clsx(
                'flex-1 rounded-xl border py-2 text-sm font-semibold transition',
                f.priceLevel === p
                  ? 'border-brand-400 bg-brand-50 text-brand-700'
                  : 'border-stone-200 text-stone-500 hover:border-stone-300',
              )}
            >
              {'£'.repeat(p)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FieldLabel>
          Phone
          <input
            value={f.phone}
            onChange={(e) => set({ phone: e.target.value })}
            placeholder="020 7946 0958"
            className={inputCls}
          />
        </FieldLabel>
        <FieldLabel>
          Website
          <input
            value={f.website}
            onChange={(e) => set({ website: e.target.value })}
            placeholder="https://yoursite.co.uk"
            className={inputCls}
          />
        </FieldLabel>
      </div>

      <div className="space-y-3 pt-1">
        {[
          { key: 'bookable' as const, icon: CalendarCheck, label: 'Accept bookings', body: 'Customers can reserve a table, appointment or class' },
          { key: 'delivers' as const, icon: Bike, label: 'Offer delivery', body: 'Customers can order food or items for delivery' },
        ].map(({ key, icon: Icon, label, body }) => (
          <button
            key={key}
            type="button"
            onClick={() => set({ [key]: !f[key] })}
            className={clsx(
              'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition',
              f[key] ? 'border-brand-300 bg-brand-50' : 'border-stone-200 hover:border-stone-300',
            )}
          >
            <div className={clsx('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg', f[key] ? 'bg-brand-100 text-brand-600' : 'bg-stone-100 text-stone-500')}>
              <Icon size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-stone-900">{label}</p>
              <p className="text-xs text-stone-500">{body}</p>
            </div>
            <div className={clsx('mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition', f[key] ? 'border-brand-500 bg-brand-500' : 'border-stone-300')}>
              {f[key] && <Check size={11} className="text-white" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function Step3({ f, set }: { f: FormState; set: (p: Partial<FormState>) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-600">
        <p className="font-semibold text-stone-900">Almost there!</p>
        <p className="mt-1">
          We review every submission to keep Gander high-quality. You'll hear back within 2 business
          days. Once approved, your listing goes live immediately.
        </p>
      </div>

      <FieldLabel>
        Contact email <span className="text-red-400">*</span>
        <input
          type="email"
          value={f.contactEmail}
          onChange={(e) => set({ contactEmail: e.target.value })}
          placeholder="owner@yourplace.co.uk"
          className={inputCls}
        />
        <p className="mt-1 text-xs text-stone-400">We'll only use this to follow up on your application.</p>
      </FieldLabel>

      <button
        type="button"
        onClick={() => set({ agreed: !f.agreed })}
        className="flex items-start gap-3 text-left"
      >
        <div className={clsx('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border-2 transition', f.agreed ? 'border-brand-500 bg-brand-500' : 'border-stone-300')}>
          {f.agreed && <Check size={11} className="text-white" />}
        </div>
        <p className="text-sm text-stone-600">
          I confirm this is a real business and I have the authority to list it. I agree to Gander's{' '}
          <Link to="/" className="text-brand-600 underline">terms of service</Link>.
        </p>
      </button>

      <div className="rounded-xl border border-stone-200 p-4">
        <p className="text-sm font-semibold text-stone-900">Listing preview</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-600">
            <Building2 size={20} />
          </div>
          <div>
            <p className="font-semibold text-stone-900">{f.name || 'Your business name'}</p>
            <p className="flex items-center gap-1 text-xs text-stone-500">
              <MapPin size={11} />
              {[f.neighbourhood, cities.find((c) => c.id === f.cityId)?.name].filter(Boolean).join(', ') || 'Location'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BusinessOnboarding() {
  const { user, configured } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setFormRaw] = useState<FormState>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(patch: Partial<FormState>) {
    setFormRaw((f) => ({ ...f, ...patch }))
  }

  function step1Valid() {
    return form.name.trim() && form.category && form.cityId && form.neighbourhood.trim() && form.address.trim() && form.postcode.trim()
  }
  function step2Valid() {
    return form.shortDescription.trim() && form.description.trim()
  }
  function step3Valid() {
    return form.contactEmail.trim() && form.agreed
  }

  function canAdvance() {
    if (step === 0) return step1Valid()
    if (step === 1) return step2Valid()
    return step3Valid()
  }

  async function handleSubmit() {
    if (!step3Valid()) return
    setSubmitting(true)
    setError(null)
    try {
      const city = cities.find((c) => c.id === form.cityId)
      await db.submitBusiness(
        {
          submitterEmail: form.contactEmail,
          name: form.name.trim(),
          category: form.category as CategoryId,
          city: city?.name ?? form.cityId,
          cityId: form.cityId,
          neighbourhood: form.neighbourhood,
          address: form.address,
          postcode: form.postcode,
          shortDescription: form.shortDescription,
          description: form.description,
          phone: form.phone,
          website: form.website,
          priceLevel: form.priceLevel,
          bookable: form.bookable,
          delivers: form.delivers,
        },
        configured && !user.isGuest ? user.id : undefined,
      )
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold text-stone-900">Application received!</h1>
        <p className="mt-3 text-stone-500">
          Thanks for submitting <strong>{form.name}</strong>. We'll review it and email{' '}
          <strong>{form.contactEmail}</strong> within 2 business days.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Back to Gander
          </Link>
          <Link
            to="/business/dashboard"
            className="rounded-full border border-stone-200 px-6 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to="/business" className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ArrowLeft size={14} /> Back
      </Link>

      <h1 className="mt-4 font-display text-2xl font-semibold text-stone-900">List your business on Gander</h1>
      <p className="mt-1 text-sm text-stone-500">Takes about 3 minutes. We review every listing before it goes live.</p>

      {/* Progress */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className={clsx(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition',
              i < step ? 'bg-brand-500 text-white' : i === step ? 'border-2 border-brand-500 text-brand-600' : 'border-2 border-stone-200 text-stone-400',
            )}>
              {i < step ? <Check size={13} /> : i + 1}
            </div>
            <span className={clsx('hidden text-xs sm:block', i === step ? 'font-semibold text-stone-900' : 'text-stone-400')}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className={clsx('h-px flex-1', i < step ? 'bg-brand-300' : 'bg-stone-200')} />}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="mb-5 font-display text-lg font-semibold text-stone-900">{STEPS[step]}</h2>

        {step === 0 && <Step1 f={form} set={set} />}
        {step === 1 && <Step2 f={form} set={set} />}
        {step === 2 && <Step3 f={form} set={set} />}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 rounded-full border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              <ArrowLeft size={15} /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="ml-auto flex items-center gap-1.5 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-40"
            >
              Continue <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canAdvance() || submitting}
              className="ml-auto flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-40"
            >
              {submitting ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : 'Submit listing'}
            </button>
          )}
        </div>
      </div>

      {!configured && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Demo mode — submissions require a live Supabase connection. Set up your backend to enable this.
        </p>
      )}
    </div>
  )
}
