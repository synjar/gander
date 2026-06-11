import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { BadgePercent, ChevronRight, Clock, Loader2, Locate, MapPin, Star } from 'lucide-react'
import clsx from 'clsx'
import { businesses } from '../data/businesses'
import { categories, categoryMap } from '../data/categories'
import { getOpenStatus } from '../lib/hours'
import { useCity } from '../city/CityContext'
import { useStore } from '../store/StoreContext'
import type { Business, CategoryId } from '../data/types'
import MapView from '../components/MapView'
import SmartImage from '../components/SmartImage'

/** Straight-line distance in km (haversine) — good enough for sorting. */
function distKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

function prettyDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

interface Venue extends Business {
  open: boolean
  hasDeal: boolean
  distance?: number
}

/** Compact venue card shared by the desktop sidebar and the mobile rail. */
function VenueCard({
  v,
  selected,
  onClick,
  innerRef,
}: {
  v: Venue
  selected: boolean
  onClick: () => void
  innerRef: (el: HTMLDivElement | null) => void
}) {
  const cat = categoryMap[v.category]
  return (
    <div
      ref={innerRef}
      onClick={onClick}
      className={clsx(
        'flex w-72 shrink-0 cursor-pointer items-center gap-3 rounded-2xl border bg-white p-3 transition lg:w-auto',
        selected ? 'border-brand-400 ring-2 ring-brand-100' : 'border-stone-200 hover:border-stone-300',
      )}
    >
      <SmartImage
        src={v.heroImage}
        seedFallback={v.id}
        emoji={cat?.emoji}
        className="h-16 w-16 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-stone-900">{v.name}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500">
          {v.rating > 0 && (
            <span className="flex items-center gap-0.5 font-semibold text-amber-600">
              <Star size={11} fill="currentColor" strokeWidth={0} /> {v.rating.toFixed(1)}
            </span>
          )}
          <span className="truncate">{cat?.label ?? v.category}</span>
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-400">
          {v.distance !== undefined && <span className="font-medium text-stone-500">{prettyDist(v.distance)}</span>}
          <span className="truncate">{v.neighbourhood}</span>
          {v.open && <span className="font-medium text-emerald-600">Open</span>}
          {v.hasDeal && (
            <span className="flex items-center gap-0.5 font-medium text-brand-600">
              <BadgePercent size={11} /> Deal
            </span>
          )}
        </p>
      </div>
      <Link
        to={`/b/${v.slug}`}
        onClick={(e) => e.stopPropagation()}
        aria-label={`View ${v.name}`}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-brand-500 hover:text-white"
      >
        <ChevronRight size={16} />
      </Link>
    </div>
  )
}

export default function MapPage() {
  const { city } = useCity()
  const { liveBusinesses, importedBusinesses, hiddenBusinesses, allDeals } = useStore()
  const [userLocation, setUserLocation] = useState<[number, number] | undefined>()
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  // Filters (Dianping-style chips)
  const [cat, setCat] = useState<CategoryId | 'all'>('all')
  const [openNow, setOpenNow] = useState(false)
  const [topRated, setTopRated] = useState(false)
  const [dealsOnly, setDealsOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const dealBusinessIds = useMemo(() => new Set(allDeals.map((d) => d.businessId)), [allDeals])

  // Everything in the city, enriched once with open/deal/distance
  const cityVenues = useMemo<Venue[]>(() => {
    const all = [...businesses, ...liveBusinesses, ...importedBusinesses]
    return all
      .filter((b) => b.cityId === city.id && !hiddenBusinesses.includes(b.id) && b.lat && b.lng)
      .map((b) => ({
        ...b,
        open: getOpenStatus(b.hours)?.open ?? b.openNow ?? false,
        hasDeal: dealBusinessIds.has(b.id),
        distance: userLocation ? distKm(userLocation[0], userLocation[1], b.lat, b.lng) : undefined,
      }))
  }, [liveBusinesses, importedBusinesses, hiddenBusinesses, city.id, dealBusinessIds, userLocation])

  // Only show category chips that actually have venues here
  const availableCats = useMemo(
    () => categories.filter((c) => cityVenues.some((v) => v.category === c.id)),
    [cityVenues],
  )

  const venues = useMemo(() => {
    return cityVenues
      .filter((v) => (cat === 'all' ? true : v.category === cat))
      .filter((v) => (openNow ? v.open : true))
      .filter((v) => (topRated ? v.rating >= 4.5 : true))
      .filter((v) => (dealsOnly ? v.hasDeal : true))
      .sort((a, b) =>
        a.distance !== undefined && b.distance !== undefined
          ? a.distance - b.distance
          : b.rating - a.rating,
      )
  }, [cityVenues, cat, openNow, topRated, dealsOnly])

  const points = useMemo(
    () =>
      venues.map((v) => ({
        id: v.id,
        name: v.name,
        lat: v.lat,
        lng: v.lng,
        slug: v.slug,
        rating: v.rating > 0 ? v.rating : undefined,
        neighbourhood: v.neighbourhood,
        emoji: categoryMap[v.category]?.emoji,
      })),
    [venues],
  )

  // Keep the selection valid as filters change
  useEffect(() => {
    if (selectedId && !venues.some((v) => v.id === selectedId)) setSelectedId(null)
  }, [venues, selectedId])

  // Bring the selected card into view (sidebar or mobile rail)
  useEffect(() => {
    if (selectedId) {
      cardRefs.current[selectedId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [selectedId])

  function locate() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError('Location isn’t supported by your browser.')
      return
    }
    setLocating(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude])
        setLocating(false)
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied — showing the city instead.'
            : 'Couldn’t get your location — showing the city instead.',
        )
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  // Try to start on the user's location.
  useEffect(() => {
    locate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The geo notice is transient — fade it out so it never crowds the overlays.
  useEffect(() => {
    if (!geoError) return
    const t = window.setTimeout(() => setGeoError(null), 5000)
    return () => window.clearTimeout(t)
  }, [geoError])

  const chipCls = (active: boolean) =>
    clsx(
      'shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold shadow-sm transition',
      active ? 'bg-brand-500 text-white' : 'bg-white text-stone-700 hover:bg-stone-50',
    )

  return (
    <div className="relative h-[calc(100vh-8.25rem)] w-full md:h-[calc(100vh-4.25rem)]">
      <Helmet>
        <title>Map — Gander</title>
      </Helmet>

      <MapView
        points={points}
        center={[city.lat, city.lng]}
        zoom={city.zoom}
        userLocation={userLocation}
        cluster
        wheelZoom
        selectedId={selectedId}
        onSelect={setSelectedId}
        className="h-full w-full"
      />

      {/* ── Top overlay: category chips + quick filters ─────────────────── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] space-y-2 p-3">
        <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          <button onClick={() => setCat('all')} className={chipCls(cat === 'all')}>
            All
          </button>
          {availableCats.map((c) => (
            <button key={c.id} onClick={() => setCat(cat === c.id ? 'all' : c.id)} className={chipCls(cat === c.id)}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <button onClick={() => setOpenNow((v) => !v)} className={clsx(chipCls(openNow), 'flex items-center gap-1.5 text-xs')}>
            <Clock size={13} /> Open now
          </button>
          <button onClick={() => setTopRated((v) => !v)} className={clsx(chipCls(topRated), 'flex items-center gap-1.5 text-xs')}>
            <Star size={13} /> 4.5+
          </button>
          <button onClick={() => setDealsOnly((v) => !v)} className={clsx(chipCls(dealsOnly), 'flex items-center gap-1.5 text-xs')}>
            <BadgePercent size={13} /> Deals
          </button>
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold text-stone-600 shadow-sm">
            <MapPin size={13} className="text-brand-500" />
            {venues.length.toLocaleString('en-GB')} places · {city.name}
          </span>
        </div>
        {geoError && (
          <p className="pointer-events-auto inline-block rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 shadow-sm">
            {geoError}
          </p>
        )}
      </div>

      {/* ── Desktop: venue list sidebar ─────────────────────────────────── */}
      <aside className="absolute left-3 top-28 z-[1000] hidden max-h-[calc(100%-8.5rem)] w-80 flex-col overflow-hidden rounded-2xl bg-white/95 shadow-xl ring-1 ring-stone-200 backdrop-blur lg:flex">
        <div className="border-b border-stone-100 px-4 py-3">
          <p className="text-sm font-semibold text-stone-900">
            {venues.length.toLocaleString('en-GB')} places
          </p>
          <p className="text-xs text-stone-400">
            {userLocation ? 'Nearest first' : 'Top rated first'} · click to find on the map
          </p>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {venues.length === 0 ? (
            <p className="py-10 text-center text-sm text-stone-400">Nothing matches these filters.</p>
          ) : (
            venues.slice(0, 60).map((v) => (
              <VenueCard
                key={v.id}
                v={v}
                selected={v.id === selectedId}
                onClick={() => setSelectedId(v.id)}
                innerRef={(el) => { cardRefs.current[v.id] = el }}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── Mobile: swipeable card rail ─────────────────────────────────── */}
      <div className="absolute inset-x-0 bottom-3 z-[1000] lg:hidden">
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 pb-1 no-scrollbar">
          {venues.slice(0, 40).map((v) => (
            <div key={v.id} className="snap-center">
              <VenueCard
                v={v}
                selected={v.id === selectedId}
                onClick={() => setSelectedId(v.id)}
                innerRef={(el) => { cardRefs.current[v.id] = el }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Locate me ───────────────────────────────────────────────────── */}
      <button
        onClick={locate}
        disabled={locating}
        aria-label="Use my location"
        className="absolute bottom-28 right-3 z-[1000] grid h-11 w-11 place-items-center rounded-full bg-white text-stone-700 shadow-lg ring-1 ring-stone-200 transition hover:bg-stone-50 disabled:opacity-50 lg:bottom-4"
      >
        {locating ? <Loader2 size={18} className="animate-spin" /> : <Locate size={18} className="text-brand-500" />}
      </button>
    </div>
  )
}
