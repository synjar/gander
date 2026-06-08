import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, X } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../lib/supabase'
import * as db from '../lib/db'

function relativeTime(ts: number): string {
  const mins = Math.round((Date.now() - ts) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-GB')
}

function NotifRow({
  notif,
  onClose,
}: {
  notif: db.Notification
  onClose: () => void
}) {
  const inner = (
    <div
      className={`flex gap-3 px-4 py-3 transition hover:bg-stone-50 ${
        !notif.read ? 'bg-brand-50/50' : ''
      }`}
    >
      {/* Unread dot */}
      <div className="mt-2 shrink-0">
        <div
          className={`h-2 w-2 rounded-full ${notif.read ? 'bg-transparent' : 'bg-brand-500'}`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-stone-900">{notif.title}</p>
        {notif.body && (
          <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">{notif.body}</p>
        )}
        <p className="mt-1 text-xs text-stone-400">{relativeTime(notif.createdAt)}</p>
      </div>
    </div>
  )

  if (notif.link) {
    return (
      <Link to={notif.link} onClick={onClose} className="block">
        {inner}
      </Link>
    )
  }
  return inner
}

export default function NotificationBell() {
  const { user, session, configured } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<db.Notification[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const userId = configured && session ? session.user.id : null

  const load = useCallback(async () => {
    if (!userId || !db.backendEnabled) return
    try {
      const notifs = await db.listNotifications(userId)
      setNotifications(notifs)
      setUnread(notifs.filter((n) => !n.read).length)
    } catch {
      // non-fatal
    }
  }, [userId])

  // Initial load
  useEffect(() => {
    void load()
  }, [load])

  // Realtime: subscribe to new notifications for this user
  useEffect(() => {
    if (!userId || !supabase || !db.backendEnabled) return
    const sb = supabase
    const channel = sb
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void load()
        },
      )
      .subscribe()
    return () => {
      void sb.removeChannel(channel)
    }
  }, [userId, load])

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  async function handleOpen() {
    const wasOpen = open
    setOpen((s) => !s)
    if (!wasOpen && userId && unread > 0) {
      // Optimistically mark as read
      setUnread(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      try {
        await db.markNotificationsRead(userId)
      } catch {
        // non-fatal
      }
    }
  }

  // Don't render for guests
  if (!configured || user.isGuest) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        className="relative grid h-9 w-9 place-items-center rounded-full border border-stone-200 text-stone-600 transition hover:bg-stone-50"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-stone-900">Notifications</h3>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-stone-400 hover:bg-stone-100"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y divide-stone-100">
            {notifications.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-stone-400">
                You're all caught up! 🎉
              </p>
            ) : (
              notifications.map((n) => (
                <NotifRow key={n.id} notif={n} onClose={() => setOpen(false)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
