import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Loader2, Locate } from 'lucide-react'
import { businesses } from '../data/businesses'
import { useCity } from '../city/CityContext'
import { useStore } from '../store/StoreContext'
import MapView from '../components/MapView'

export default function MapPage() {
  const { city } = useCity()
  const { liveBusinesses, importedBusinesses, hiddenBusinesses } = useStore()
  const [userLocation, setUserLocation] = useState<[number, number] | undefined>()
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const points = useMemo(() => {
    const all = [...businesses, ...liveBusinesses, ...importedBusinesses]
    return all
      .filter((b) => b.cityId === city.id && !hiddenBusinesses.includes(b.id) && b.lat && b.lng)
      .map((b) => ({
        id: b.id,
        name: b.name,
        lat: b.lat,
        lng: b.lng,
        slug: b.slug,
        rating: b.rating > 0 ? b.rating : undefined,
        neighbourhood: b.neighbourhood,
      }))
  }, [liveBusinesses, importedBusinesses, hiddenBusinesses, city.id])

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Helmet>
        <title>Map — Gander</title>
      </Helmet>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-stone-900 sm:text-3xl">Explore the map</h1>
          <p className="mt-0.5 text-sm text-stone-500">
            {points.length.toLocaleString('en-GB')} places in {city.name}
          </p>
        </div>
        <button
          onClick={locate}
          disabled={locating}
          className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
        >
          {locating ? <Loader2 size={15} className="animate-spin" /> : <Locate size={15} className="text-brand-500" />}
          {userLocation ? 'Recenter on me' : 'Use my location'}
        </button>
      </div>

      {geoError && <p className="mt-2 text-sm text-amber-600">{geoError}</p>}

      <div
        className="mt-4 overflow-hidden rounded-2xl ring-1 ring-stone-200"
        style={{ height: 'calc(100vh - 15rem)' }}
      >
        <MapView
          points={points}
          center={[city.lat, city.lng]}
          zoom={city.zoom}
          userLocation={userLocation}
          cluster
          className="h-full w-full"
        />
      </div>
    </div>
  )
}
