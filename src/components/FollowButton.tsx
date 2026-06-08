import { useEffect, useState } from 'react'
import { UserPlus, UserCheck, Loader2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import * as db from '../lib/db'

interface Props {
  targetUserId: string
  size?: 'sm' | 'md'
}

export default function FollowButton({ targetUserId, size = 'sm' }: Props) {
  const { user, session, configured } = useAuth()
  const myUserId = configured && session ? session.user.id : null

  const [following, setFollowing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!myUserId || !db.backendEnabled || myUserId === targetUserId) return
    db.isFollowing(myUserId, targetUserId)
      .then((v) => { setFollowing(v); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [myUserId, targetUserId])

  // Don't show for guests, own profile, or non-backend
  if (!configured || user.isGuest || myUserId === targetUserId || !db.backendEnabled) return null
  if (!loaded) return null

  async function toggle() {
    if (!myUserId || busy) return
    setBusy(true)
    try {
      if (following) {
        await db.unfollowUser(myUserId, targetUserId)
        setFollowing(false)
      } else {
        await db.followUser(myUserId, targetUserId)
        setFollowing(true)
      }
    } catch {
      // non-fatal
    } finally {
      setBusy(false)
    }
  }

  const base = size === 'sm'
    ? 'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition'
    : 'flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition'

  return (
    <button
      onClick={(e) => { e.stopPropagation(); void toggle() }}
      disabled={busy}
      className={`${base} ${
        following
          ? 'border-stone-200 bg-stone-50 text-stone-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600'
          : 'border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100'
      } disabled:opacity-50`}
    >
      {busy ? (
        <Loader2 size={12} className="animate-spin" />
      ) : following ? (
        <UserCheck size={12} />
      ) : (
        <UserPlus size={12} />
      )}
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
