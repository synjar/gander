import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Booking, Business, BusinessSubmission, Deal, Order, Review, Voucher } from '../data/types'
import { seedReviews } from '../data/reviews'
import { deals as seedDeals } from '../data/deals'
import { currentUser } from '../data/users'
import { img } from '../lib/img'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../lib/supabase'
import * as db from '../lib/db'

const LS_KEY = 'gander.state.v1'

interface OwnerResponse {
  text: string
  date: string
}

interface Persisted {
  userReviews: Review[]
  favourites: string[]
  bookings: Booking[]
  vouchers: Voucher[]
  likedReviews: string[]
  likedPosts: string[]
  reviewResponses: Record<string, OwnerResponse>
  merchantDeals: Deal[]
  managedBusinessId: string
  orders: Order[]
  hiddenReviews: string[]
  hiddenBusinesses: string[]
}

const EMPTY: Persisted = {
  userReviews: [],
  favourites: [],
  bookings: [],
  vouchers: [],
  likedReviews: [],
  likedPosts: [],
  reviewResponses: {},
  merchantDeals: [],
  managedBusinessId: 'copper-whisk',
  orders: [],
  hiddenReviews: [],
  hiddenBusinesses: [],
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return EMPTY
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Persisted>) }
  } catch {
    return EMPTY
  }
}

export interface NewReview {
  businessId: string
  rating: number
  food?: number
  service?: number
  ambience?: number
  value?: number
  title?: string
  body: string
  photos?: string[]
  visitType?: string
}

export interface NewBooking {
  businessId: string
  businessName: string
  date: string
  time: string
  partySize: number
  occasion?: string
}

export interface NewDeal {
  businessId: string
  title: string
  description: string
  originalPrice: number
  dealPrice: number
  tag?: string
}

export interface NewOrder {
  businessId: string
  businessName: string
  total: number
  items: number
}

interface StoreValue extends Persisted {
  allReviews: Review[]
  allDeals: Deal[]
  reviewsFor: (businessId: string) => Review[]
  dealsForBusinessId: (businessId: string) => Deal[]
  dealById: (id: string) => Deal | undefined
  statsFor: (b: Business) => { rating: number; reviewCount: number }
  isFavourite: (id: string) => boolean
  toggleFavourite: (id: string) => void
  addReview: (input: NewReview) => void
  addBooking: (input: NewBooking) => Booking
  cancelBooking: (id: string) => void
  buyVoucher: (deal: Deal, businessName: string) => Voucher
  isReviewLiked: (id: string) => boolean
  toggleReviewLike: (id: string) => void
  isPostLiked: (id: string) => boolean
  togglePostLike: (id: string) => void
  responseFor: (reviewId: string) => OwnerResponse | undefined
  respondToReview: (reviewId: string, text: string) => void
  addMerchantDeal: (input: NewDeal) => void
  setManagedBusiness: (id: string) => void
  placeOrder: (input: NewOrder) => void
  isReviewHidden: (id: string) => boolean
  toggleReviewHidden: (id: string) => void
  isBusinessHidden: (id: string) => boolean
  toggleBusinessHidden: (id: string) => void
  liveBusinesses: Business[]
  submissions: BusinessSubmission[]
  approveSubmission: (id: string) => Promise<void>
  rejectSubmission: (id: string, note?: string) => Promise<void>
  /** True when reads/writes are backed by Supabase for a signed-in user. */
  backendSynced: boolean
}

const StoreContext = createContext<StoreValue | null>(null)

function voucherCode(): string {
  const s = Math.random().toString(36).slice(2, 6).toUpperCase()
  const t = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `GNDR-${s}-${t}`
}

function logError(scope: string) {
  return (err: unknown) => console.error(`[gander] ${scope}`, err)
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, session, configured } = useAuth()
  const backendUserId = configured && session ? session.user.id : null
  const backendUser = useMemo(
    () => ({ id: user.id, name: user.name, avatar: user.avatar ?? '' }),
    [user.id, user.name, user.avatar],
  )

  const initial = useMemo(() => (db.backendEnabled ? EMPTY : load()), [])
  const [userReviews, setUserReviews] = useState<Review[]>(initial.userReviews)
  const [backendReviews, setBackendReviews] = useState<Review[]>([])
  const [favourites, setFavourites] = useState<string[]>(initial.favourites)
  const [bookings, setBookings] = useState<Booking[]>(initial.bookings)
  const [vouchers, setVouchers] = useState<Voucher[]>(initial.vouchers)
  const [likedReviews, setLikedReviews] = useState<string[]>(initial.likedReviews)
  const [likedPosts, setLikedPosts] = useState<string[]>(initial.likedPosts)
  const [reviewResponses, setReviewResponses] = useState<Record<string, OwnerResponse>>(
    initial.reviewResponses,
  )
  const [merchantDeals, setMerchantDeals] = useState<Deal[]>(initial.merchantDeals)
  const [managedBusinessId, setManagedBusinessId] = useState<string>(initial.managedBusinessId)
  const [orders, setOrders] = useState<Order[]>(initial.orders)
  const [hiddenReviews, setHiddenReviews] = useState<string[]>(initial.hiddenReviews)
  const [hiddenBusinesses, setHiddenBusinesses] = useState<string[]>(initial.hiddenBusinesses)
  const [liveBusinesses, setLiveBusinesses] = useState<Business[]>([])
  const [submissions, setSubmissions] = useState<BusinessSubmission[]>([])

  // Demo mode: persist everything to localStorage. (Backend mode persists per-row.)
  useEffect(() => {
    if (db.backendEnabled) return
    const data: Persisted = {
      userReviews,
      favourites,
      bookings,
      vouchers,
      likedReviews,
      likedPosts,
      reviewResponses,
      merchantDeals,
      managedBusinessId,
      orders,
      hiddenReviews,
      hiddenBusinesses,
    }
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data))
    } catch {
      /* ignore quota errors in the prototype */
    }
  }, [
    userReviews,
    favourites,
    bookings,
    vouchers,
    likedReviews,
    likedPosts,
    reviewResponses,
    merchantDeals,
    managedBusinessId,
    orders,
    hiddenReviews,
    hiddenBusinesses,
  ])

  // Public, globally-readable data (responses, merchant deals, all reviews).
  const reloadPublic = useCallback(async () => {
    if (!db.backendEnabled) return
    const [resps, mdeals, revs, liveBiz, subs] = await Promise.all([
      db.listResponses(),
      db.listMerchantDeals(),
      db.listAllReviews(),
      db.listApprovedBusinesses(),
      db.listSubmissions(),
    ])
    setReviewResponses(resps)
    setMerchantDeals(mdeals)
    setBackendReviews(revs)
    setLiveBusinesses(liveBiz)
    setSubmissions(subs)
  }, [])

  const reloadUser = useCallback(async () => {
    if (!backendUserId) return
    const [bks, vchs] = await Promise.all([
      db.listBookings(backendUserId),
      db.listVouchers(backendUserId),
    ])
    setBookings(bks)
    setVouchers(vchs)
  }, [backendUserId])

  // Initial load of public data when backend is configured.
  useEffect(() => {
    if (!db.backendEnabled) return
    void reloadPublic().catch(logError('load public'))
  }, [reloadPublic])

  // Realtime: live updates for reviews, deals and owner responses.
  useEffect(() => {
    if (!db.backendEnabled || !supabase) return
    const sb = supabase
    const channel = sb
      .channel('gander-public')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
        void reloadPublic()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'merchant_deals' }, () => {
        void reloadPublic()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'review_responses' }, () => {
        void reloadPublic()
      })
      .subscribe()
    return () => {
      void sb.removeChannel(channel)
    }
  }, [reloadPublic])

  // Hydrate (or clear) the signed-in user's personal data when auth changes.
  useEffect(() => {
    if (!db.backendEnabled) return
    if (!backendUserId) {
      setFavourites([])
      setBookings([])
      setVouchers([])
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const [favs, bks, vchs] = await Promise.all([
          db.listFavourites(backendUserId),
          db.listBookings(backendUserId),
          db.listVouchers(backendUserId),
        ])
        if (cancelled) return
        setFavourites(favs)
        setBookings(bks)
        setVouchers(vchs)
      } catch (e) {
        logError('hydrate user')(e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [backendUserId])

  const allReviews = useMemo(
    () => (db.backendEnabled ? [...backendReviews, ...seedReviews] : [...userReviews, ...seedReviews]),
    [backendReviews, userReviews],
  )
  const allDeals = useMemo(() => [...merchantDeals, ...seedDeals], [merchantDeals])

  const reviewsFor = useCallback(
    (businessId: string) =>
      allReviews.filter((r) => r.businessId === businessId && !hiddenReviews.includes(r.id)),
    [allReviews, hiddenReviews],
  )
  const dealsForBusinessId = useCallback(
    (businessId: string) => allDeals.filter((d) => d.businessId === businessId),
    [allDeals],
  )
  const dealById = useCallback((id: string) => allDeals.find((d) => d.id === id), [allDeals])

  const statsFor = useCallback(
    (b: Business) => {
      const mine = userReviews.filter((r) => r.businessId === b.id)
      if (mine.length === 0) return { rating: b.rating, reviewCount: b.reviewCount }
      const base = b.rating * b.reviewCount
      const sum = mine.reduce((s, r) => s + r.rating, 0)
      const count = b.reviewCount + mine.length
      return { rating: Math.round(((base + sum) / count) * 10) / 10, reviewCount: count }
    },
    [userReviews],
  )

  const isFavourite = useCallback((id: string) => favourites.includes(id), [favourites])

  const toggleFavourite = useCallback(
    (id: string) => {
      const isFav = favourites.includes(id)
      setFavourites((prev) => (isFav ? prev.filter((x) => x !== id) : [id, ...prev]))
      if (backendUserId) {
        const op = isFav
          ? db.removeFavourite(backendUserId, id)
          : db.addFavourite(backendUserId, id)
        op.catch(logError('favourite'))
      }
    },
    [favourites, backendUserId],
  )

  const addReview = useCallback(
    (input: NewReview) => {
      const r: Review = {
        id: `me-rev-${Date.now()}`,
        businessId: input.businessId,
        authorId: backendUser.id,
        authorName: backendUser.name,
        authorAvatar: backendUser.avatar || currentUser.avatar,
        authorLevel: currentUser.level,
        rating: input.rating,
        food: input.food,
        service: input.service,
        ambience: input.ambience,
        value: input.value,
        date: 'Just now',
        title: input.title,
        body: input.body,
        photos: input.photos ?? [],
        likes: 0,
        visitType: input.visitType,
      }
      if (db.backendEnabled) {
        setBackendReviews((prev) => [r, ...prev]) // optimistic
        if (backendUserId) {
          db.createReview(backendUserId, {
            businessId: input.businessId,
            rating: input.rating,
            body: input.body,
            food: input.food,
            service: input.service,
            ambience: input.ambience,
            value: input.value,
            title: input.title,
            photos: input.photos,
            visitType: input.visitType,
          })
            .then(reloadPublic)
            .catch(logError('addReview'))
        }
      } else {
        setUserReviews((prev) => [r, ...prev])
      }
    },
    [backendUserId, backendUser, reloadPublic],
  )

  const addBooking = useCallback(
    (input: NewBooking) => {
      const b: Booking = {
        id: `bk-${Date.now()}`,
        businessId: input.businessId,
        businessName: input.businessName,
        date: input.date,
        time: input.time,
        partySize: input.partySize,
        occasion: input.occasion,
        status: 'confirmed',
        createdAt: Date.now(),
      }
      setBookings((prev) => [b, ...prev])
      if (backendUserId) {
        db.createBooking(backendUserId, {
          businessId: input.businessId,
          businessName: input.businessName,
          date: input.date,
          time: input.time,
          partySize: input.partySize,
          occasion: input.occasion,
        })
          .then(reloadUser)
          .catch(logError('addBooking'))
      }
      return b
    },
    [backendUserId, reloadUser],
  )

  const cancelBooking = useCallback(
    (id: string) => {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)))
      if (backendUserId) db.cancelBooking(id).catch(logError('cancelBooking'))
    },
    [backendUserId],
  )

  const buyVoucher = useCallback(
    (deal: Deal, businessName: string) => {
      const v: Voucher = {
        id: `vch-${Date.now()}`,
        dealId: deal.id,
        businessId: deal.businessId,
        businessName,
        title: deal.title,
        dealPrice: deal.dealPrice,
        code: voucherCode(),
        purchasedAt: Date.now(),
        redeemed: false,
      }
      setVouchers((prev) => [v, ...prev])
      if (backendUserId) {
        db.createVoucher(backendUserId, {
          id: v.id,
          dealId: v.dealId,
          businessId: v.businessId,
          businessName: v.businessName,
          title: v.title,
          dealPrice: v.dealPrice,
          code: v.code,
          redeemed: false,
        }).catch(logError('buyVoucher'))
      }
      return v
    },
    [backendUserId],
  )

  const toggleReviewLike = useCallback((id: string) => {
    setLikedReviews((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]))
  }, [])

  const togglePostLike = useCallback((id: string) => {
    setLikedPosts((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]))
  }, [])

  const respondToReview = useCallback(
    (reviewId: string, text: string) => {
      setReviewResponses((prev) => ({ ...prev, [reviewId]: { text, date: 'Just now' } }))
      if (backendUserId) {
        db.respondToReview(backendUserId, reviewId, text)
          .then(reloadPublic)
          .catch(logError('respondToReview'))
      }
    },
    [backendUserId, reloadPublic],
  )

  const addMerchantDeal = useCallback(
    (input: NewDeal) => {
      const d: Deal = {
        id: `mdeal-${Date.now()}`,
        businessId: input.businessId,
        title: input.title,
        description: input.description,
        originalPrice: input.originalPrice,
        dealPrice: input.dealPrice,
        sold: 0,
        image: img('food,offer', Date.now()),
        tag: input.tag,
        expires: '31 Dec 2026',
      }
      setMerchantDeals((prev) => [d, ...prev])
      if (backendUserId) {
        db.createMerchantDeal(backendUserId, {
          businessId: d.businessId,
          title: d.title,
          description: d.description,
          originalPrice: d.originalPrice,
          dealPrice: d.dealPrice,
          image: d.image,
          tag: d.tag,
          expires: d.expires,
        })
          .then(reloadPublic)
          .catch(logError('addMerchantDeal'))
      }
    },
    [backendUserId, reloadPublic],
  )

  const placeOrder = useCallback((input: NewOrder) => {
    setOrders((prev) => [
      {
        id: `ord-${Date.now()}`,
        businessId: input.businessId,
        businessName: input.businessName,
        total: input.total,
        items: input.items,
        createdAt: Date.now(),
      },
      ...prev,
    ])
  }, [])

  const toggleReviewHidden = useCallback((id: string) => {
    setHiddenReviews((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]))
  }, [])

  const toggleBusinessHidden = useCallback((id: string) => {
    setHiddenBusinesses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev],
    )
  }, [])

  const approveSubmission = useCallback(async (id: string) => {
    await db.updateSubmissionStatus(id, 'approved')
    await reloadPublic()
  }, [reloadPublic])

  const rejectSubmission = useCallback(async (id: string, note?: string) => {
    await db.updateSubmissionStatus(id, 'rejected', note)
    await reloadPublic()
  }, [reloadPublic])

  const value: StoreValue = {
    userReviews,
    favourites,
    bookings,
    vouchers,
    likedReviews,
    likedPosts,
    reviewResponses,
    merchantDeals,
    managedBusinessId,
    allReviews,
    allDeals,
    reviewsFor,
    dealsForBusinessId,
    dealById,
    statsFor,
    isFavourite,
    toggleFavourite,
    addReview,
    addBooking,
    cancelBooking,
    buyVoucher,
    isReviewLiked: (id) => likedReviews.includes(id),
    toggleReviewLike,
    isPostLiked: (id) => likedPosts.includes(id),
    togglePostLike,
    responseFor: (id) => reviewResponses[id],
    respondToReview,
    addMerchantDeal,
    setManagedBusiness: setManagedBusinessId,
    orders,
    hiddenReviews,
    hiddenBusinesses,
    placeOrder,
    isReviewHidden: (id) => hiddenReviews.includes(id),
    toggleReviewHidden,
    isBusinessHidden: (id) => hiddenBusinesses.includes(id),
    toggleBusinessHidden,
    liveBusinesses,
    submissions,
    approveSubmission,
    rejectSubmission,
    backendSynced: Boolean(backendUserId),
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
