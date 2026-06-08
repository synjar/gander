export type CategoryId =
  | 'restaurants'
  | 'cafes'
  | 'bars'
  | 'pubs'
  | 'salons'
  | 'beauty'
  | 'gyms'
  | 'fitness'
  | 'spas'
  | 'hotels'
  | 'shopping'
  | 'activities'
  | 'entertainment'
  | 'nightlife'
  | 'attractions'

export interface Category {
  id: CategoryId
  label: string
  /** lucide-react icon name */
  icon: string
  emoji: string
  blurb: string
}

export interface OpeningHours {
  day: string
  open: string
  close: string
}

export interface Dish {
  name: string
  price: number
  description?: string
}

export interface Business {
  id: string
  slug: string
  name: string
  category: CategoryId
  cuisine?: string
  tags: string[]
  rating: number
  reviewCount: number
  priceLevel: 1 | 2 | 3 | 4
  neighbourhood: string
  city: string
  cityId: string
  address: string
  postcode: string
  phone: string
  website?: string
  heroImage: string
  images: string[]
  shortDescription: string
  description: string
  hours: OpeningHours[]
  openNow: boolean
  amenities: string[]
  scores: { food: number; service: number; ambience: number; value: number }
  lat: number
  lng: number
  bookable: boolean
  delivers: boolean
  popularDishes?: Dish[]
  rank?: number
  featured?: boolean
  /** Set on approved business submissions — the Supabase user id of the submitter. */
  ownerId?: string
  /** 'osm' for OpenStreetMap-imported venues; undefined/absent = hand-curated seed */
  source?: 'osm'
  /** Whether an OSM-imported listing has been claimed by its owner */
  claimed?: boolean
  /** OSM element identifier e.g. "node/123456" */
  osmId?: string
  /** True when OSM fee=no — used on attraction cards and detail pages */
  freeEntry?: boolean
}

export interface Review {
  id: string
  businessId: string
  authorId: string
  authorName: string
  authorAvatar: string
  authorLevel: number
  rating: number
  food?: number
  service?: number
  ambience?: number
  value?: number
  date: string
  title?: string
  body: string
  photos: string[]
  likes: number
  visitType?: string
}

export interface Deal {
  id: string
  businessId: string
  title: string
  description: string
  originalPrice: number
  dealPrice: number
  sold: number
  image: string
  tag?: string
  expires: string
}

export interface User {
  id: string
  name: string
  avatar: string
  level: number
  points: number
  bio: string
  joined: string
  neighbourhood: string
  reviewCount: number
  photoCount: number
  followerCount: number
  followingCount: number
}

export type FeedType = 'review' | 'checkin' | 'photo' | 'list'

export interface FeedPost {
  id: string
  userId: string
  userName: string
  userAvatar: string
  userLevel: number
  type: FeedType
  businessId: string
  businessName: string
  neighbourhood: string
  rating?: number
  text: string
  photos: string[]
  likes: number
  comments: number
  time: string
}

export interface Booking {
  id: string
  businessId: string
  businessName: string
  date: string
  time: string
  partySize: number
  occasion?: string
  status: 'confirmed' | 'cancelled'
  createdAt: number
}

export interface Voucher {
  id: string
  dealId: string
  businessId: string
  businessName: string
  title: string
  dealPrice: number
  code: string
  purchasedAt: number
  redeemed: boolean
}

export interface BusinessSubmission {
  id: string
  submitterId?: string
  submitterEmail: string
  name: string
  slug: string
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
  status: 'pending' | 'approved' | 'rejected'
  reviewerNote?: string
  submittedAt: number
}

export interface Order {
  id: string
  businessId: string
  businessName: string
  total: number
  items: number
  createdAt: number
}
