import { useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Locate, Loader2, MapPin, SlidersHorizontal, X } from 'lucide-react'
import clsx from 'clsx'
import { businesses } from '../data/businesses'
import { categories, categoryMap } from '../data/categories'
import type { Business } from '../data/types'
import { useCity } from '../city/CityContext'
import { useStore } from '../store/StoreContext'
import { priceLevel } from '../lib/format'
import { distanceKm, formatDistance } from '../lib/xp'
import BusinessCard from '../components/BusinessCard'
import MapView from '../components/MapView'

type SortKey = 'recommended' | 'rating' | 'reviews' | 'price-asc' | 'price-desc' | 'nearby'

const sortLabels: Record<SortKey, string> = {
  recommended: 'Recommended',
  nearby: 'Nearest first',
  rating: 'Highest rated',
  reviews: 'Most reviewed',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
}

function matchesQuery(b: Business, q: string): boolean {
  if (!q) return true
  const hay = [
    b.name,
    b.cuisine ?? '',
    b.neighbourhood,
    categoryMap[b.category].label,
    ...b.tags,
  ]
    .join(' ')
    .toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((word) => hay.includes(word))
}

function MapPanel({ results }: { results: Business[] }) {
  const { city } = useCity()
  return (
    <div className="sticky top-24 hidden h-[calc(100vh-7rem)] overflow-hidden rounded-2xl ring-1 ring-stone-200 lg:block">
      <MapView
        points={results.map((b) => ({
          id: b.id,
          name: b.name,
          lat: b.lat,
          lng: b.lng,
          slug: b.slug,
          rating: b.rating,
          neighbourhood: b.neighbourhood,
        }))}
        center={[city.lat, city.lng]}
        zoom={city.zoom}
        className="h-full w-full"
      />
    </div>
  )
}

export default function Search() {
  const [params, setParams] = useSearchParams()
  const { city } = useCity()
  const { hiddenBusinesses, liveBusinesses } = useStore()
  const allBiz = useMemo(() => [...businesses, ...liveBusinesses], [liveBusinesses])
  const q = params.get('q') ?? ''
  const category = params.get('category') ?? 'all'
  const neighbourhood = params.get('neighbourhood') ?? 'all'

  const [prices, setPrices] = useState<number[]>([])
  const [minRating, setMinRating] = useState(0)
  const [sort, setSort] = useState<SortKey>('recommended')
  const [showFilters, setShowFilters] = useState(false)

  // Near-me state
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const handleNearMe = useCallback(() => {
    if (userLat !== null) {
      // Already have position — toggle off
      setUserLat(null)
      setUserLng(null)
      setSort('recommended')
      return
    }
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by your browser')
      return
    }
    setGeoLoading(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude)
        setUserLng(pos.coords.longitude)
        setSort('nearby')
        setGeoLoading(false)
      },
      () => {
        setGeoError('Could not get your location')
        setGeoLoading(false)
      },
      { timeout: 8000, maximumAge: 60_000 },
    )
  }, [userLat])

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next)
  }

  function togglePrice(level: number) {
    setPrices((prev) =>
      prev.includes(level) ? prev.filter((p) => p !== level) : [...prev, level],
    )
  }

  // Build distance map when user location is known
  const distanceMap = useMemo<Map<string, number>>(() => {
    const map = new Map<string, number>()
    if (userLat === null || userLng === null) return map
    for (const b of allBiz) {
      if (b.lat != null && b.lng != null) {
        map.set(b.id, distanceKm(userLat, userLng, b.lat, b.lng))
      }
    }
    return map
  }, [userLat, userLng, allBiz])

  const results = useMemo(() => {
    let list = allBiz.filter(
      (b) => b.cityId === city.id && !hiddenBusinesses.includes(b.id) && matchesQuery(b, q),
    )
    if (category !== 'all') list = list.filter((b) => b.category === category)
    if (neighbourhood !== 'all' && city.neighbourhoods.includes(neighbourhood))
      list = list.filter((b) => b.neighbourhood === neighbourhood)
    if (prices.length) list = list.filter((b) => prices.includes(b.priceLevel))
    if (minRating) list = list.filter((b) => b.rating >= minRating)

    switch (sort) {
      case 'nearby':
        list = [...list].sort((a, b) => (distanceMap.get(a.id) ?? Infinity) - (distanceMap.get(b.id) ?? Infinity))
        break
      case 'rating':
        list = [...list].sort((a, b) => b.rating - a.rating)
        break
      case 'reviews':
        list = [...list].sort((a, b) => b.reviewCount - a.reviewCount)
        break
      case 'price-asc':
        list = [...list].sort((a, b) => a.priceLevel - b.priceLevel)
        break
      case 'price-desc':
        list = [...list].sort((a, b) => b.priceLevel - a.priceLevel)
        break
      default:
        list = [...list].sort(
          (a, b) => b.rating * Math.log10(b.reviewCount + 10) - a.rating * Math.log10(a.reviewCount + 10),
        )
    }
    return list
  }, [q, category, neighbourhood, prices, minRating, sort, city, hiddenBusinesses, allBiz, distanceMap])

  const hasFilters = category !== 'all' || neighbourhood !== 'all' || prices.length > 0 || minRating > 0

  const heading = q
    ? `“${q}”`
    : category !== 'all'
      ? categoryMap[category as Business['category']]?.label ?? 'All places'
      : 'All places'

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Helmet>
        <title>{q ? `"${q}" — Search` : heading} | Gander</title>
        <meta name="description" content={`Find the best ${q || 'places'} in ${city.name} on Gander — real reviews from real locals.`} />
      </Helmet>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
            {heading}
            {neighbourhood !== 'all' && city.neighbourhoods.includes(neighbourhood) && (
              <span className="text-stone-400"> in {neighbourhood}</span>
            )}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {results.length} {results.length === 1 ? 'place' : 'places'} in {city.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Near me button */}
          <button
            type="button"
            onClick={handleNearMe}
            title={geoError ?? undefined}
            className={clsx(
              'flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition',
              userLat !== null
                ? 'border-brand-300 bg-brand-50 text-brand-700'
                : geoError
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : 'border-stone-200 text-stone-700 hover:bg-stone-50',
            )}
          >
            {geoLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Locate size={15} />
            )}
            <span className="hidden sm:inline">Near me</span>
          </button>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className="flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 lg:hidden"
          >
            <SlidersHorizontal size={15} /> Filters
          </button>
          <label className="flex items-center gap-2 text-sm text-stone-500">
            <span className="hidden sm:inline">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 outline-none focus:border-brand-400"
            >
              {Object.entries(sortLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Category pills */}
      <div className="mt-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
        <button
          onClick={() => setParam('category', 'all')}
          className={clsx(
            'shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition',
            category === 'all'
              ? 'bg-stone-900 text-white'
              : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50',
          )}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setParam('category', c.id)}
            className={clsx(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition',
              category === c.id
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50',
            )}
          >
            <span>{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* Secondary filters */}
      <div className={clsx('mt-3 flex-wrap items-center gap-2 sm:flex', showFilters ? 'flex' : 'hidden lg:flex')}>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((level) => (
            <button
              key={level}
              onClick={() => togglePrice(level)}
              className={clsx(
                'rounded-lg border px-2.5 py-1.5 text-sm font-medium transition',
                prices.includes(level)
                  ? 'border-brand-300 bg-brand-50 text-brand-700'
                  : 'border-stone-200 text-stone-500 hover:bg-stone-50',
              )}
            >
              {priceLevel(level)}
            </button>
          ))}
        </div>
        <select
          value={city.neighbourhoods.includes(neighbourhood) ? neighbourhood : 'all'}
          onChange={(e) => setParam('neighbourhood', e.target.value)}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-brand-400"
        >
          <option value="all">Any neighbourhood</option>
          {city.neighbourhoods.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-brand-400"
        >
          <option value={0}>Any rating</option>
          <option value={4}>4.0+</option>
          <option value={4.5}>4.5+</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => {
              setParam('category', 'all')
              setParam('neighbourhood', 'all')
              setPrices([])
              setMinRating(0)
            }}
            className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Results + map */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div>
          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 py-20 text-center">
              <MapPin className="mx-auto text-stone-300" size={40} />
              <p className="mt-3 font-semibold text-stone-700">No places match those filters</p>
              <p className="mt-1 text-sm text-stone-500">Try widening your search or clearing filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((b) => {
                const km = distanceMap.get(b.id)
                return (
                  <BusinessCard
                    key={b.id}
                    business={b}
                    showRank
                    distance={km != null ? formatDistance(km) : undefined}
                  />
                )
              })}
            </div>
          )}
        </div>
        <MapPanel results={results} />
      </div>
    </div>
  )
}
