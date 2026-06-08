import { useEffect, useState } from 'react'
import { CheckCheck, MapPin, Loader2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import * as db from '../lib/db'
import { XP } from '../lib/xp'

interface Props {
  businessId: string
  businessName: string
  onXpAwarded?: (amount: number) => void
}

export default function CheckInButton({ businessId, businessName, onXpAwarded }: Props) {
  const { user, session, configured } = useAuth()
  const userId = configured && session ? session.user.id : null

  const [checkedInToday, setCheckedInToday] = useState(false)
  const [count, setCount] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void db.getCheckInCount(businessId).then(setCount)
    if (userId) {
      void db.hasCheckedInToday(userId, businessId).then(setCheckedInToday)
    }
  }, [businessId, userId])

  async function handleCheckIn() {
    if (!userId || checkedInToday || busy) return
    setBusy(true)
    try {
      await db.checkIn(userId, businessId, businessName)
      await db.awardPoints(userId, XP.CHECKIN)
      setCheckedInToday(true)
      setCount((c) => (c ?? 0) + 1)
      onXpAwarded?.(XP.CHECKIN)
    } catch {
      // non-fatal
    } finally {
      setBusy(false)
    }
  }

  if (!configured || user.isGuest) return null

  return (
    <button
      onClick={handleCheckIn}
      disabled={checkedInToday || busy || !userId}
      className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
        checkedInToday
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default'
          : 'border-stone-200 bg-white text-stone-800 hover:bg-stone-50 disabled:opacity-50'
      }`}
      title={checkedInToday ? "You've checked in today" : `Check in (+${XP.CHECKIN} XP)`}
    >
      {busy ? (
        <Loader2 size={17} className="animate-spin" />
      ) : checkedInToday ? (
        <CheckCheck size={17} className="text-emerald-600" />
      ) : (
        <MapPin size={17} className="text-brand-500" />
      )}
      {checkedInToday ? 'Checked in' : 'Check in'}
      {count !== null && count > 0 && (
        <span className="ml-0.5 text-xs font-normal opacity-60">
          · {count.toLocaleString('en-GB')}
        </span>
      )}
    </button>
  )
}
