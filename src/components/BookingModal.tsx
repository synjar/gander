import { useState } from 'react'
import { Calendar, Check, Clock, Minus, Plus, Users } from 'lucide-react'
import clsx from 'clsx'
import Modal from './Modal'
import { useStore } from '../store/StoreContext'
import type { Booking, Business } from '../data/types'

const TIMES = [
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
]
const OCCASIONS = ['None', 'Birthday', 'Anniversary', 'Date night', 'Business', 'Celebration']

function prettyDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

interface Props {
  open: boolean
  onClose: () => void
  business: Business
  mode?: 'table' | 'class' | 'treatment'
}

export default function BookingModal({ open, onClose, business, mode = 'table' }: Props) {
  const { addBooking } = useStore()
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [time, setTime] = useState('19:00')
  const [party, setParty] = useState(2)
  const [occasion, setOccasion] = useState('None')
  const [confirmed, setConfirmed] = useState<Booking | null>(null)

  const noun = mode === 'class' ? 'class' : mode === 'treatment' ? 'treatment' : 'table'

  function submit() {
    const b = addBooking({
      businessId: business.id,
      businessName: business.name,
      date,
      time,
      partySize: party,
      occasion: occasion === 'None' ? undefined : occasion,
    })
    setConfirmed(b)
  }

  function close() {
    onClose()
    setTimeout(() => setConfirmed(null), 250)
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={confirmed ? 'Booking confirmed' : `Book a ${noun} at ${business.name}`}
    >
      {confirmed ? (
        <div className="py-4 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
            <Check size={30} />
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold text-stone-900">You’re all set!</h3>
          <p className="mt-1 text-sm text-stone-500">
            We’ve sent a confirmation to your email. Show this at the venue.
          </p>
          <div className="mx-auto mt-5 max-w-xs rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left">
            <p className="font-semibold text-stone-900">{business.name}</p>
            <p className="text-sm text-stone-500">{business.neighbourhood} · {business.address}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-stone-400">Date</p>
                <p className="font-medium text-stone-800">{prettyDate(confirmed.date)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400">Time</p>
                <p className="font-medium text-stone-800">{confirmed.time}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400">Party</p>
                <p className="font-medium text-stone-800">
                  {confirmed.partySize} {confirmed.partySize === 1 ? 'guest' : 'guests'}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-400">Ref</p>
                <p className="font-mono text-xs font-medium text-stone-800">
                  {confirmed.id.slice(-6).toUpperCase()}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={close}
            className="mt-6 w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-stone-700">
              <Calendar size={15} className="text-brand-500" /> Date
            </label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-stone-700">
              <Clock size={15} className="text-brand-500" /> Time
            </label>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  className={clsx(
                    'rounded-lg border py-2 text-sm font-medium transition',
                    time === t
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-stone-700">
              <Users size={15} className="text-brand-500" /> Party size
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setParty((p) => Math.max(1, p - 1))}
                className="grid h-10 w-10 place-items-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 text-center text-lg font-semibold text-stone-900">{party}</span>
              <button
                type="button"
                onClick={() => setParty((p) => Math.min(12, p + 1))}
                className="grid h-10 w-10 place-items-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50"
              >
                <Plus size={16} />
              </button>
              <span className="text-sm text-stone-400">
                {party === 12 ? 'For larger groups, call the venue' : 'guests'}
              </span>
            </div>
          </div>

          {mode === 'table' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                Occasion (optional)
              </label>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400"
              >
                {OCCASIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={submit}
            className="w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Confirm booking · {prettyDate(date)} at {time}
          </button>
          <p className="text-center text-xs text-stone-400">
            Free to book. You won’t be charged — this is a prototype.
          </p>
        </div>
      )}
    </Modal>
  )
}
