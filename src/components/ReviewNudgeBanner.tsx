/**
 * ReviewNudgeBanner
 *
 * Shown once per browser session when the user has visited a venue (booking or
 * voucher purchase) but hasn't left a review yet. Fades in below the header and
 * can be dismissed — dismissal is stored in sessionStorage so it doesn't re-
 * appear until the next fresh session.
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, X } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useStore } from '../store/StoreContext'
import { businessesById } from '../data/businesses'
import * as db from '../lib/db'

interface PendingVenue {
  businessId: string
  businessName: string
  slug?: string
}

const SESSION_KEY = 'gander.review_nudge_seen'

export default function ReviewNudgeBanner() {
  const { user, configured } = useAuth()
  const { bookings, vouchers, allReviews } = useStore()
  const [venues, setVenues] = useState<PendingVenue[]>([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show once per browser session
    if (sessionStorage.getItem(SESSION_KEY)) return

    if (configured && !user.isGuest && user.id) {
      // Real Supabase user — query the backend
      db.getPendingReviewVenues(user.id).then((pending) => {
        if (pending.length === 0) return
        setVenues(pending.map((p) => ({
          ...p,
          slug: businessesById[p.businessId]?.slug,
        })))
        setVisible(true)
      })
    } else {
      // Guest / demo mode — derive from local store
      const myAuthorId = 'me'
      const reviewedIds = new Set(
        allReviews
          .filter((r) => r.authorId === myAuthorId)
          .map((r) => r.businessId),
      )
      const today = new Date().toISOString().slice(0, 10)
      const pending: PendingVenue[] = []
      const seen = new Set<string>()

      for (const b of bookings) {
        if (
          b.status === 'confirmed' &&
          b.date < today &&
          !reviewedIds.has(b.businessId) &&
          !seen.has(b.businessId)
        ) {
          pending.push({
            businessId: b.businessId,
            businessName: b.businessName,
            slug: businessesById[b.businessId]?.slug,
          })
          seen.add(b.businessId)
        }
      }

      for (const v of vouchers) {
        if (!reviewedIds.has(v.businessId) && !seen.has(v.businessId)) {
          pending.push({
            businessId: v.businessId,
            businessName: v.businessName,
            slug: businessesById[v.businessId]?.slug,
          })
          seen.add(v.businessId)
        }
      }

      if (pending.length > 0) {
        setVenues(pending)
        setVisible(true)
      }
    }
  // Run once on mount — deps intentionally omitted for session-level check
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(false)
  }

  if (!visible || venues.length === 0) return null

  const first = venues[0]
  const extra = venues.length - 1

  return (
    <div className="mx-auto max-w-7xl px-4 pt-3">
      <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
        <Star size={17} className="shrink-0 text-amber-500" fill="currentColor" />
        <p className="min-w-0 flex-1 text-sm text-stone-700">
          <span className="font-semibold">How was {first.businessName}?</span>
          {extra > 0 && (
            <span className="text-stone-500">
              {' '}+{extra} other{extra > 1 ? 's' : ''} waiting for a review
            </span>
          )}
          {' — '}
          <Link
            to={first.slug ? `/b/${first.slug}` : '/me'}
            onClick={dismiss}
            className="font-semibold text-amber-700 underline-offset-2 hover:underline"
          >
            Leave a review
          </Link>
          <span className="ml-2 text-stone-400 text-xs">· earn XP</span>
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-lg p-1 text-stone-400 transition hover:bg-amber-100 hover:text-stone-600"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
