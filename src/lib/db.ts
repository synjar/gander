// Typed data-access layer for the Supabase backend.
//
// These functions talk to the tables defined in supabase/schema.sql. They're
// only used when Supabase is configured. The app currently runs on the
// localStorage store (src/store/StoreContext.tsx); to go fully server-backed,
// have the store call these when `backendEnabled` is true and a user is signed
// in. Each function maps snake_case rows to the app's camelCase types.

import { supabase, isSupabaseConfigured } from './supabase'
import type { Booking, Business, BusinessSubmission, CategoryId, Deal, Review, Voucher } from '../data/types'

export const backendEnabled = isSupabaseConfigured

function client() {
  if (!supabase) throw new Error('Supabase is not configured (set VITE_SUPABASE_* env vars).')
  return supabase
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
