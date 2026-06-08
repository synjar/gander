// Typed data-access layer for the Supabase backend.
//
// These functions talk to the tables defined in supabase/schema.sql. They're
// only used when Supabase is configured. The app currently runs on the
// localStorage store (src/store/StoreContext.tsx); to go fully server-backed,
// have the store call these when `backendEnabled` is true and a user is signed
// in. Each function maps snake_case rows to the app's camelCase types.

import { supabase, isSupabaseConfigured } from './supabase'
import type { Booking, Business, BusinessSubmission, CategoryId, Deal, Review, Voucher } from '../data/types'
import type { OsmVenue } from './overpass'

export const backendEnabled = isSupabaseConfigured

function client() {
  if (!supabase) throw new Error('Supabase is not configured (set VITE_SUPABASE_* env vars).')
  return supabase
}

// --- Profiles ---------------------------------------------------------------

export interface PublicProfile {
  id: string
  name: string
  avatar?: string
  level: number
  points: number
  bio?: string
  neighbourhood?: string
  joined: string // formatted date string
}

export async function getProfile(userId: string): Promise<PublicProfile | null> {
  if (!backendEnabled) return null
  const { data } = await client()
    .from('profiles')
    .select('id, name, avatar, level, points, bio, neighbourhood, created_at')
    .eq('id', userId)
    .maybeSingle()
  if (!data) return null
  return {
    id: data.id,
    name: data.name,
    avatar: data.avatar ?? undefined,
    level: data.level ?? 1,
    points: data.points ?? 0,
    bio: data.bio ?? undefined,
    neighbourhood: data.neighbourhood ?? undefined,
    joined: new Date(data.created_at as string).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
  }
}

// --- Favourites ------------------------------------------------------------
export async function listFavourites(userId: string): Promise<string[]> {
  const { data, error } = await client()
    .from('favourites')
    .select('business_id')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []).map((r) => r.business_id as string)
}

export async function addFavourite(userId: string, businessId: string): Promise<void> {
  const { error } = await client()
    .from('favourites')
    .upsert({ user_id: userId, business_id: businessId })
  if (error) throw error
}

export async function removeFavourite(userId: string, businessId: string): Promise<void> {
  const { error } = await client()
    .from('favourites')
    .delete()
    .eq('user_id', userId)
    .eq('business_id', businessId)
  if (error) throw error
}

// --- Bookings --------------------------------------------------------------
export async function listBookings(userId: string): Promise<Booking[]> {
  const { data, error } = await client()
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    businessId: r.business_id,
    businessName: r.business_name,
    date: r.date,
    time: r.time,
    partySize: r.party_size,
    occasion: r.occasion ?? undefined,
    status: r.status,
    createdAt: new Date(r.created_at).getTime(),
  }))
}

export async function createBooking(
  userId: string,
  b: Omit<Booking, 'id' | 'status' | 'createdAt'>,
): Promise<void> {
  const { error } = await client().from('bookings').insert({
    user_id: userId,
    business_id: b.businessId,
    business_name: b.businessName,
    date: b.date,
    time: b.time,
    party_size: b.partySize,
    occasion: b.occasion,
  })
  if (error) throw error
}

export async function cancelBooking(id: string): Promise<void> {
  const { error } = await client().from('bookings').update({ status: 'cancelled' }).eq('id', id)
  if (error) throw error
}

// --- Vouchers --------------------------------------------------------------
export async function listVouchers(userId: string): Promise<Voucher[]> {
  const { data, error } = await client()
    .from('vouchers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    dealId: r.deal_id,
    businessId: r.business_id,
    businessName: r.business_name,
    title: r.title,
    dealPrice: Number(r.deal_price),
    code: r.code,
    purchasedAt: new Date(r.created_at).getTime(),
    redeemed: r.redeemed,
  }))
}

export async function createVoucher(userId: string, v: Omit<Voucher, 'purchasedAt'>): Promise<void> {
  const { error } = await client().from('vouchers').insert({
    id: v.id,
    user_id: userId,
    deal_id: v.dealId,
    business_id: v.businessId,
    business_name: v.businessName,
    title: v.title,
    deal_price: v.dealPrice,
    code: v.code,
    redeemed: v.redeemed,
  })
  if (error) throw error
}

// --- Reviews (the signed-in user's own) ------------------------------------
export async function listMyReviews(userId: string): Promise<Partial<Review>[]> {
  const { data, error } = await client()
    .from('reviews')
    .select('*')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    businessId: r.business_id,
    authorId: r.author_id,
    rating: r.rating,
    food: r.food ?? undefined,
    service: r.service ?? undefined,
    ambience: r.ambience ?? undefined,
    value: r.value ?? undefined,
    title: r.title ?? undefined,
    body: r.body,
    photos: r.photos ?? [],
    visitType: r.visit_type ?? undefined,
  }))
}

export async function createReview(
  userId: string,
  r: Pick<Review, 'businessId' | 'rating' | 'body'> &
    Partial<Pick<Review, 'food' | 'service' | 'ambience' | 'value' | 'title' | 'photos' | 'visitType'>>,
): Promise<void> {
  const { error } = await client().from('reviews').insert({
    author_id: userId,
    business_id: r.businessId,
    rating: r.rating,
    food: r.food,
    service: r.service,
    ambience: r.ambience,
    value: r.value,
    title: r.title,
    body: r.body,
    photos: r.photos ?? [],
    visit_type: r.visitType,
  })
  if (error) throw error
}

// --- Merchant: review responses & deals ------------------------------------
export async function listResponses(): Promise<Record<string, { text: string; date: string }>> {
  const { data, error } = await client().from('review_responses').select('review_id, body, created_at')
  if (error) throw error
  const out: Record<string, { text: string; date: string }> = {}
  for (const r of data ?? []) {
    out[r.review_id] = { text: r.body, date: new Date(r.created_at).toLocaleDateString('en-GB') }
  }
  return out
}

export async function respondToReview(
  ownerId: string,
  reviewId: string,
  text: string,
): Promise<void> {
  const { error } = await client()
    .from('review_responses')
    .upsert({ review_id: reviewId, owner_id: ownerId, body: text })
  if (error) throw error
}

export async function listMerchantDeals(): Promise<Deal[]> {
  const { data, error } = await client().from('merchant_deals').select('*')
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    businessId: r.business_id,
    title: r.title,
    description: r.description ?? '',
    originalPrice: Number(r.original_price),
    dealPrice: Number(r.deal_price),
    sold: r.sold ?? 0,
    image: r.image ?? '',
    tag: r.tag ?? undefined,
    expires: r.expires ?? '',
  }))
}

export async function createMerchantDeal(
  ownerId: string,
  d: Omit<Deal, 'id' | 'sold'>,
): Promise<void> {
  const { error } = await client().from('merchant_deals').insert({
    owner_id: ownerId,
    business_id: d.businessId,
    title: d.title,
    description: d.description,
    original_price: d.originalPrice,
    deal_price: d.dealPrice,
    tag: d.tag,
    image: d.image,
    expires: d.expires,
  })
  if (error) throw error
}

// --- Business submissions ---------------------------------------------------

function makeSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export interface NewBusinessSubmission {
  submitterEmail: string
  name: string
  category: CategoryId
  city: string
  cityId: string
  neighbourhood: string
  address: string
  postcode: string
  shortDescription: string
  description: string
  phone: string
  website: string
  priceLevel: 1 | 2 | 3 | 4
  bookable: boolean
  delivers: boolean
}

export async function submitBusiness(
  sub: NewBusinessSubmission,
  userId?: string,
): Promise<void> {
  const { error } = await client().from('business_submissions').insert({
    submitter_id: userId ?? null,
    submitter_email: sub.submitterEmail,
    name: sub.name,
    slug: makeSlug(sub.name),
    category: sub.category,
    city: sub.city,
    city_id: sub.cityId,
    neighbourhood: sub.neighbourhood,
    address: sub.address,
    postcode: sub.postcode,
    short_description: sub.shortDescription,
    description: sub.description,
    phone: sub.phone,
    website: sub.website,
    price_level: sub.priceLevel,
    bookable: sub.bookable,
    delivers: sub.delivers,
  })
  if (error) throw error
}

export async function listSubmissions(status?: string): Promise<BusinessSubmission[]> {
  let q = client().from('business_submissions').select('*').order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    submitterId: r.submitter_id ?? undefined,
    submitterEmail: r.submitter_email,
    name: r.name,
    slug: r.slug,
    category: r.category as CategoryId,
    city: r.city,
    cityId: r.city_id,
    neighbourhood: r.neighbourhood,
    address: r.address,
    postcode: r.postcode,
    shortDescription: r.short_description,
    description: r.description,
    phone: r.phone,
    website: r.website,
    priceLevel: r.price_level as 1 | 2 | 3 | 4,
    bookable: r.bookable,
    delivers: r.delivers,
    status: r.status as 'pending' | 'approved' | 'rejected',
    reviewerNote: r.reviewer_note ?? undefined,
    submittedAt: new Date(r.created_at).getTime(),
  }))
}

export async function updateSubmissionStatus(
  id: string,
  status: 'approved' | 'rejected',
  note?: string,
): Promise<void> {
  const { error } = await client()
    .from('business_submissions')
    .update({ status, reviewer_note: note ?? null, reviewed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

function submissionToBusiness(r: BusinessSubmission): Business {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    tags: [],
    rating: 0,
    reviewCount: 0,
    ownerId: r.submitterId,
    priceLevel: r.priceLevel,
    neighbourhood: r.neighbourhood,
    city: r.city,
    cityId: r.cityId,
    address: r.address,
    postcode: r.postcode,
    phone: r.phone,
    website: r.website || undefined,
    heroImage: `https://loremflickr.com/800/600/${encodeURIComponent(r.name)},food`,
    images: [],
    shortDescription: r.shortDescription || r.description.slice(0, 120),
    description: r.description,
    hours: [],
    openNow: false,
    amenities: [],
    scores: { food: 0, service: 0, ambience: 0, value: 0 },
    lat: 0,
    lng: 0,
    bookable: r.bookable,
    delivers: r.delivers,
  }
}

export async function listApprovedBusinesses(): Promise<Business[]> {
  const { data, error } = await client()
    .from('business_submissions')
    .select('*')
    .eq('status', 'approved')
  if (error) throw error
  return (data ?? []).map((r) => submissionToBusiness({
    id: r.id,
    submitterId: r.submitter_id ?? undefined,
    submitterEmail: r.submitter_email,
    name: r.name,
    slug: r.slug,
    category: r.category as CategoryId,
    city: r.city,
    cityId: r.city_id,
    neighbourhood: r.neighbourhood,
    address: r.address,
    postcode: r.postcode,
    shortDescription: r.short_description,
    description: r.description,
    phone: r.phone,
    website: r.website,
    priceLevel: r.price_level as 1 | 2 | 3 | 4,
    bookable: r.bookable,
    delivers: r.delivers,
    status: 'approved',
    submittedAt: new Date(r.created_at).getTime(),
  }))
}

// --- All reviews (with author profile) — used for realtime feeds -----------
function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB')
}

export async function listAllReviews(): Promise<Review[]> {
  const { data, error } = await client()
    .from('reviews')
    .select('*, author:profiles(name, avatar, level)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    businessId: r.business_id,
    authorId: r.author_id,
    authorName: r.author?.name ?? 'Gander user',
    authorAvatar: r.author?.avatar ?? '',
    authorLevel: r.author?.level ?? 1,
    rating: r.rating,
    food: r.food ?? undefined,
    service: r.service ?? undefined,
    ambience: r.ambience ?? undefined,
    value: r.value ?? undefined,
    date: relativeTime(r.created_at),
    title: r.title ?? undefined,
    body: r.body,
    photos: r.photos ?? [],
    likes: 0,
    visitType: r.visit_type ?? undefined,
  }))
}

// --- Staff management -------------------------------------------------------

export interface StaffMember {
  id: string
  businessId: string
  businessName: string
  email: string
  name: string
  createdAt: number
}

export async function listStaff(businessId: string): Promise<StaffMember[]> {
  const { data, error } = await client()
    .from('staff_members')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    businessId: r.business_id,
    businessName: r.business_name,
    email: r.email,
    name: r.name,
    createdAt: new Date(r.created_at).getTime(),
  }))
}

export async function addStaffMember(
  businessId: string,
  businessName: string,
  email: string,
  name: string,
): Promise<void> {
  const { error } = await client()
    .from('staff_members')
    .insert({ business_id: businessId, business_name: businessName, email, name })
  if (error) throw error
}

export async function removeStaffMember(id: string): Promise<void> {
  const { error } = await client()
    .from('staff_members')
    .delete()
    .eq('id', id)
  if (error) throw error
}

/** Returns the business this email is registered as staff for, or null. */
export async function getStaffBusiness(email: string): Promise<{ businessId: string; businessName: string } | null> {
  const { data, error } = await client()
    .from('staff_members')
    .select('business_id, business_name')
    .eq('email', email)
    .maybeSingle()
  if (error || !data) return null
  return { businessId: data.business_id as string, businessName: data.business_name as string }
}

// --- Stripe Connect ---------------------------------------------------------

/** Returns the Stripe connected account ID for a business, or null. */
export async function getMerchantStripeAccount(businessId: string): Promise<string | null> {
  if (!backendEnabled) return null
  const { data } = await client()
    .from('merchant_stripe_accounts')
    .select('stripe_account_id')
    .eq('business_id', businessId)
    .maybeSingle()
  return (data?.stripe_account_id as string) ?? null
}

/** Saves (or upserts) a Stripe connected account ID for a business. */
export async function saveMerchantStripeAccount(businessId: string, stripeAccountId: string): Promise<void> {
  const { error } = await client()
    .from('merchant_stripe_accounts')
    .upsert(
      { business_id: businessId, stripe_account_id: stripeAccountId },
      { onConflict: 'business_id' },
    )
  if (error) throw error
}

// --- Business profiles (owner-editable details + photos) --------------------

export interface DayHours {
  open: string    // "09:00"
  close: string   // "22:00"
  closed: boolean
}

export interface BusinessProfile {
  businessId: string
  name?: string
  shortDescription?: string
  description?: string
  phone?: string
  website?: string
  address?: string
  postcode?: string
  heroImageUrl?: string
  galleryUrls: string[]
  amenities: string[]
  hours?: Record<string, DayHours> // keyed by day name e.g. "Monday"
}

export async function getBusinessProfile(businessId: string): Promise<BusinessProfile | null> {
  if (!backendEnabled) return null
  const { data } = await client()
    .from('business_profiles')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle()
  if (!data) return null
  return {
    businessId: data.business_id as string,
    name: (data.name as string) ?? undefined,
    shortDescription: (data.short_description as string) ?? undefined,
    description: (data.description as string) ?? undefined,
    phone: (data.phone as string) ?? undefined,
    website: (data.website as string) ?? undefined,
    address: (data.address as string) ?? undefined,
    postcode: (data.postcode as string) ?? undefined,
    heroImageUrl: (data.hero_image_url as string) ?? undefined,
    galleryUrls: (data.gallery_urls as string[]) ?? [],
    amenities: (data.amenities as string[]) ?? [],
    hours: (data.hours as Record<string, DayHours>) ?? undefined,
  }
}

export async function saveBusinessProfile(
  businessId: string,
  profile: Partial<Omit<BusinessProfile, 'businessId'>>,
): Promise<void> {
  const { error } = await client()
    .from('business_profiles')
    .upsert(
      {
        business_id: businessId,
        name: profile.name ?? null,
        short_description: profile.shortDescription ?? null,
        description: profile.description ?? null,
        phone: profile.phone ?? null,
        website: profile.website ?? null,
        address: profile.address ?? null,
        postcode: profile.postcode ?? null,
        hero_image_url: profile.heroImageUrl ?? null,
        gallery_urls: profile.galleryUrls ?? [],
        amenities: profile.amenities ?? [],
        hours: profile.hours ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'business_id' },
    )
  if (error) throw error
}

// --- Merchant: read bookings for their business ----------------------------

export interface BusinessBooking {
  id: string
  userId: string
  customerName: string
  customerEmail?: string
  businessId: string
  businessName: string
  date: string
  time: string
  partySize: number
  occasion?: string
  status: 'confirmed' | 'cancelled' | 'pending'
  createdAt: number
}

export async function listBusinessBookings(businessId: string): Promise<BusinessBooking[]> {
  // Fetch bookings first
  const { data: bookingRows, error } = await client()
    .from('bookings')
    .select('*')
    .eq('business_id', businessId)
    .order('date', { ascending: true })
    .order('time', { ascending: true })
  if (error) throw new Error(error.message)

  if (!bookingRows || bookingRows.length === 0) return []

  // Fetch matching profiles to get customer names
  const userIds = [...new Set(bookingRows.map((r) => r.user_id as string))]
  const { data: profileRows } = await client()
    .from('profiles')
    .select('id, name')
    .in('id', userIds)
  const nameById: Record<string, string> = {}
  for (const p of profileRows ?? []) {
    nameById[p.id as string] = p.name as string
  }

  return bookingRows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    customerName: nameById[r.user_id as string] ?? 'Guest',
    businessId: r.business_id,
    businessName: r.business_name,
    date: r.date,
    time: r.time,
    partySize: r.party_size,
    occasion: r.occasion ?? undefined,
    status: r.status as 'confirmed' | 'cancelled' | 'pending',
    createdAt: new Date(r.created_at).getTime(),
  }))
}

export async function updateBookingStatus(
  id: string,
  status: 'confirmed' | 'cancelled' | 'pending',
): Promise<void> {
  const { error } = await client().from('bookings').update({ status }).eq('id', id)
  if (error) throw error
}

// --- Notifications ----------------------------------------------------------

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body?: string
  link?: string
  read: boolean
  createdAt: number
}

export async function listNotifications(userId: string): Promise<Notification[]> {
  if (!backendEnabled) return []
  const { data, error } = await client()
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    userId: r.user_id,
    type: r.type,
    title: r.title,
    body: r.body ?? undefined,
    link: r.link ?? undefined,
    read: r.read,
    createdAt: new Date(r.created_at).getTime(),
  }))
}

export async function createNotification(
  userId: string,
  notif: Pick<Notification, 'type' | 'title' | 'body' | 'link'>,
): Promise<void> {
  if (!backendEnabled) return
  const { error } = await client().from('notifications').insert({
    user_id: userId,
    type: notif.type,
    title: notif.title,
    body: notif.body ?? null,
    link: notif.link ?? null,
  })
  if (error) console.warn('[gander] notification insert failed:', error)
}

export async function markNotificationsRead(userId: string): Promise<void> {
  if (!backendEnabled) return
  await client().from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
}

/** Looks up the owner (submitter_id) of an owned business and creates a notification for them. */
export async function notifyBusinessOwner(
  businessId: string,
  notif: Pick<Notification, 'type' | 'title' | 'body' | 'link'>,
): Promise<void> {
  if (!backendEnabled) return
  const { data } = await client()
    .from('business_submissions')
    .select('submitter_id')
    .eq('id', businessId)
    .eq('status', 'approved')
    .maybeSingle()
  const ownerId = data?.submitter_id as string | null
  if (!ownerId) return
  await createNotification(ownerId, notif)
}

/** Returns voucher stats for a business (avg spend, total revenue, count). */
export async function getBusinessVoucherStats(businessId: string): Promise<{
  count: number
  avgSpend: number | null
  totalRevenue: number
}> {
  const { data } = await client()
    .from('vouchers')
    .select('deal_price')
    .eq('business_id', businessId)
  if (!data || data.length === 0) return { count: 0, avgSpend: null, totalRevenue: 0 }
  const prices = data.map((v) => Number(v.deal_price))
  const total = prices.reduce((a, b) => a + b, 0)
  return { count: prices.length, avgSpend: total / prices.length, totalRevenue: total }
}

// --- XP / Points ------------------------------------------------------------

/** Atomically award points to a user and recalculate their level via Supabase RPC. */
export async function awardPoints(userId: string, amount: number): Promise<void> {
  if (!backendEnabled) return
  await client().rpc('award_points', { p_user_id: userId, p_amount: amount })
}

export async function getUserPoints(userId: string): Promise<{ points: number; level: number }> {
  const { data } = await client()
    .from('profiles')
    .select('points, level')
    .eq('id', userId)
    .maybeSingle()
  return { points: Number(data?.points ?? 0), level: Number(data?.level ?? 1) }
}

// --- Leaderboard ------------------------------------------------------------

export interface LeaderboardEntry {
  id: string
  name: string
  avatar?: string
  level: number
  points: number
  reviewCount?: number
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  if (!backendEnabled) return []
  const { data } = await client()
    .from('profiles')
    .select('id, name, avatar, level, points')
    .order('points', { ascending: false })
    .limit(limit)
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    avatar: r.avatar ?? undefined,
    level: r.level,
    points: r.points,
  }))
}

// --- Check-ins --------------------------------------------------------------

export interface CheckIn {
  id: string
  userId: string
  businessId: string
  businessName: string
  createdAt: number
}

export async function checkIn(userId: string, businessId: string, businessName: string): Promise<void> {
  const { error } = await client()
    .from('check_ins')
    .insert({ user_id: userId, business_id: businessId, business_name: businessName })
  if (error) throw new Error(error.message)
}

export async function getCheckIns(userId: string): Promise<CheckIn[]> {
  const { data, error } = await client()
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({
    id: r.id,
    userId: r.user_id,
    businessId: r.business_id,
    businessName: r.business_name,
    createdAt: new Date(r.created_at).getTime(),
  }))
}

export async function getCheckInCount(businessId: string): Promise<number> {
  if (!backendEnabled) return 0
  const { count } = await client()
    .from('check_ins')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
  return count ?? 0
}

export async function getUserCheckInCount(userId: string): Promise<number> {
  if (!backendEnabled) return 0
  const { count } = await client()
    .from('check_ins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  return count ?? 0
}

export async function hasCheckedInToday(userId: string, businessId: string): Promise<boolean> {
  if (!backendEnabled) return false
  const today = new Date().toISOString().slice(0, 10)
  const { count } = await client()
    .from('check_ins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .gte('created_at', `${today}T00:00:00`)
  return (count ?? 0) > 0
}

// --- Follows ----------------------------------------------------------------

export async function followUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await client()
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId })
  if (error) throw new Error(error.message)
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await client()
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
  if (error) throw new Error(error.message)
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (!backendEnabled) return false
  const { count } = await client()
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
  return (count ?? 0) > 0
}

export async function getFollowing(userId: string): Promise<string[]> {
  const { data } = await client()
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)
  return (data ?? []).map((r) => r.following_id as string)
}

export async function getFollowerCount(userId: string): Promise<number> {
  if (!backendEnabled) return 0
  const { count } = await client()
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId)
  return count ?? 0
}

export async function getFollowingCount(userId: string): Promise<number> {
  if (!backendEnabled) return 0
  const { count } = await client()
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId)
  return count ?? 0
}

// --- Referrals --------------------------------------------------------------

export async function recordReferral(referrerId: string, referredId: string): Promise<void> {
  if (!backendEnabled) return
  // Only record once — unique constraint on referred_id
  const { error } = await client()
    .from('referrals')
    .insert({ referrer_id: referrerId, referred_id: referredId })
  if (error) return // silently ignore duplicates
  // Award XP to referrer
  await awardPoints(referrerId, 100)
}

export async function hasBeenReferred(userId: string): Promise<boolean> {
  if (!backendEnabled) return false
  const { count } = await client()
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referred_id', userId)
  return (count ?? 0) > 0
}

/** Find a user ID by their referral code (first 8 hex chars of UUID, uppercase) */
export async function findUserByReferralCode(code: string): Promise<string | null> {
  if (!backendEnabled || code.length !== 8) return null
  // Referral code = first 8 chars of UUID with dashes removed
  // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  // Without dashes: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  // First 8 chars match the first 8 chars of the UUID (before first dash)
  const uuidPrefix = code.toLowerCase()
  const { data } = await client()
    .from('profiles')
    .select('id')
    .ilike('id', `${uuidPrefix}%`)
    .limit(1)
  return (data?.[0]?.id as string) ?? null
}

// --- Merchant analytics -----------------------------------------------------

export interface MonthlyRevenue {
  month: string // "Jan", "Feb", etc.
  revenue: number
  count: number
}

export interface DayBookings {
  day: string // "Mon", "Tue", etc.
  count: number
}

export async function getVoucherRevenueTrend(businessId: string): Promise<MonthlyRevenue[]> {
  if (!backendEnabled) return []
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  const { data } = await client()
    .from('vouchers')
    .select('deal_price, created_at')
    .eq('business_id', businessId)
    .gte('created_at', sixMonthsAgo.toISOString())
    .order('created_at', { ascending: true })
  if (!data || data.length === 0) return []

  const byMonth: Record<string, { revenue: number; count: number }> = {}
  for (const row of data) {
    const d = new Date(row.created_at as string)
    const key = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
    if (!byMonth[key]) byMonth[key] = { revenue: 0, count: 0 }
    byMonth[key].revenue += Number(row.deal_price)
    byMonth[key].count += 1
  }
  return Object.entries(byMonth).map(([month, v]) => ({ month, ...v }))
}

// --- Imported businesses (OSM) ----------------------------------------------

/**
 * Bulk-upsert OSM venues into imported_businesses.
 * - New venues are inserted.
 * - Existing unclaimed venues are updated (refreshes hours, phone, photos etc).
 * - Claimed venues are never touched so owner data is preserved.
 * Returns { inserted, updated, skippedClaimed }.
 */
export async function importOSMVenues(
  venues: OsmVenue[],
): Promise<{ inserted: number; updated: number; skippedClaimed: number }> {
  if (!backendEnabled || venues.length === 0)
    return { inserted: 0, updated: 0, skippedClaimed: 0 }

  // Find which of these OSM IDs are already claimed so we don't overwrite them
  const osmIds = venues.map((v) => v.osmId)
  const { data: existing } = await client()
    .from('imported_businesses')
    .select('osm_id, claimed, id')
    .in('osm_id', osmIds)

  const claimedIds  = new Set((existing ?? []).filter((r) => r.claimed).map((r) => r.osm_id as string))
  const existingIds = new Set((existing ?? []).map((r) => r.osm_id as string))

  const toUpsert = venues.filter((v) => !claimedIds.has(v.osmId))
  const skippedClaimed = venues.length - toUpsert.length

  if (toUpsert.length === 0) return { inserted: 0, updated: 0, skippedClaimed }

  const rows = toUpsert.map((v) => ({
    osm_id:            v.osmId,
    name:              v.name,
    slug:              v.slug,
    category:          v.category,
    cuisine:           v.cuisine ?? null,
    neighbourhood:     v.neighbourhood,
    city:              v.city,
    city_id:           v.cityId,
    address:           v.address,
    postcode:          v.postcode,
    phone:             v.phone,
    website:           v.website,
    lat:               v.lat,
    lng:               v.lng,
    hours:             v.hours,
    tags:              v.tags,
    amenities:         v.amenities,
    hero_image:        v.heroImage,
    short_description: v.shortDescription,
    description:       v.description,
    bookable:          v.bookable,
    delivers:          v.delivers,
    price_level:       v.priceLevel,
  }))

  // ignoreDuplicates:false → ON CONFLICT DO UPDATE (refreshes existing rows)
  const { data, error } = await client()
    .from('imported_businesses')
    .upsert(rows, { onConflict: 'osm_id', ignoreDuplicates: false })
    .select('id, osm_id')

  if (error) throw new Error(error.message)

  const upserted = data ?? []
  const inserted = upserted.filter((r) => !existingIds.has(r.osm_id as string)).length
  const updated  = upserted.length - inserted

  return { inserted, updated, skippedClaimed }
}

/** Fetch all active imported businesses, optionally filtered by cityId. */
export async function listImportedBusinesses(cityId?: string): Promise<Business[]> {
  if (!backendEnabled) return []
  let q = client()
    .from('imported_businesses')
    .select('*')
    .eq('status', 'active')
  if (cityId) q = q.eq('city_id', cityId)
  const { data } = await q.order('name')
  return (data ?? []).map(rowToBusiness)
}

function rowToBusiness(r: Record<string, unknown>): Business {
  return {
    id:               r.id as string,
    osmId:            r.osm_id as string,
    slug:             r.slug as string,
    name:             r.name as string,
    source:           'osm',
    claimed:          Boolean(r.claimed),
    ownerId:          r.claimed_by as string | undefined,
    category:         r.category as Business['category'],
    cuisine:          r.cuisine as string | undefined,
    tags:             (r.tags as string[]) ?? [],
    rating:           0,
    reviewCount:      0,
    priceLevel:       (r.price_level as 1|2|3|4) ?? 2,
    neighbourhood:    r.neighbourhood as string,
    city:             r.city as string,
    cityId:           r.city_id as string,
    address:          r.address as string,
    postcode:         r.postcode as string ?? '',
    phone:            r.phone as string ?? '',
    website:          r.website as string ?? '',
    heroImage:        (r.hero_image as string) || '',
    images:           [],
    shortDescription: (r.short_description as string) || '',
    description:      (r.description as string) || '',
    hours:            (r.hours as Business['hours']) ?? [],
    openNow:          false,
    amenities:        (r.amenities as string[]) ?? [],
    scores:           { food: 0, service: 0, ambience: 0, value: 0 },
    lat:              r.lat as number,
    lng:              r.lng as number,
    bookable:         Boolean(r.bookable),
    delivers:         Boolean(r.delivers),
  }
}

/** Get OSM IDs that are already in imported_businesses (to detect dupes in preview). */
export async function getImportedOsmIds(cityId: string): Promise<Set<string>> {
  if (!backendEnabled) return new Set()
  const { data } = await client()
    .from('imported_businesses')
    .select('osm_id')
    .eq('city_id', cityId)
  return new Set((data ?? []).map((r) => r.osm_id as string))
}

/** Mark an imported listing as claimed by a user. */
export async function claimBusiness(businessId: string, userId: string): Promise<void> {
  const { error } = await client()
    .from('imported_businesses')
    .update({ claimed: true, claimed_by: userId })
    .eq('id', businessId)
  if (error) throw new Error(error.message)
}

/** Returns the count of imported businesses for a city. */
export async function countImportedBusinesses(cityId: string): Promise<number> {
  if (!backendEnabled) return 0
  const { count } = await client()
    .from('imported_businesses')
    .select('id', { count: 'exact', head: true })
    .eq('city_id', cityId)
  return count ?? 0
}

/** Returns business IDs ordered by review count in the last 30 days (for Trending section) */
export async function getTrendingBusinessIds(limit = 8): Promise<string[]> {
  if (!backendEnabled) return []
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const { data } = await client()
    .from('reviews')
    .select('business_id')
    .gte('created_at', since.toISOString())
  if (!data || data.length === 0) return []
  const counts: Record<string, number> = {}
  for (const row of data) {
    const id = row.business_id as string
    counts[id] = (counts[id] ?? 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)
}

export async function getBookingsByDayOfWeek(businessId: string): Promise<DayBookings[]> {
  if (!backendEnabled) return []
  const { data } = await client()
    .from('bookings')
    .select('date')
    .eq('business_id', businessId)
  if (!data || data.length === 0) return []

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const row of data) {
    const d = new Date((row.date as string) + 'T12:00:00')
    counts[d.getDay()]++
  }
  return DAYS.map((day, i) => ({ day, count: counts[i] }))
}
