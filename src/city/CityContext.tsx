import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { cities as staticCities, cityMap, DEFAULT_CITY, nearestCity, type City } from '../data/cities'
import * as db from '../lib/db'

const KEY = 'gander.city'

interface CityValue {
  cityId: string
  city: City
  setCity: (id: string) => void
  /** Every selectable city: the curated static list plus one entry per
   *  imported county/area, derived live from the database. */
  cities: City[]
  /** The user's detected location, once geolocation resolves (else null). */
  userLocation: [number, number] | null
}

const CityContext = createContext<CityValue | null>(null)

/** Build a City entry for an imported area the static list doesn't know about. */
function dynamicCity(s: db.ImportedCityStat): City {
  return {
    id: s.cityId,
    name: s.cityName,
    lat: s.centerLat,
    lng: s.centerLng,
    zoom: 10, // county-ish framing; the map refits to venue bounds anyway
    blurb: `The best of ${s.cityName}, picked by locals`,
    neighbourhoods: s.towns.filter((t) => t !== s.cityName).sort(),
  }
}

export function CityProvider({ children }: { children: ReactNode }) {
  const [cityId, setCityId] = useState<string>(() => {
    try {
      // Accept any saved id — it may be a dynamic city we haven't loaded yet.
      return localStorage.getItem(KEY) || DEFAULT_CITY
    } catch {
      return DEFAULT_CITY
    }
  })
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [dynamicCities, setDynamicCities] = useState<City[]>([])

  function setCity(id: string) {
    setCityId(id)
    try {
      localStorage.setItem(KEY, id)
    } catch {
      /* ignore */
    }
  }

  // Derive extra cities from imported venues (e.g. a county imported in the
  // admin console) so they appear in the picker without a code change.
  useEffect(() => {
    let cancelled = false
    db.listImportedCityStats().then((stats) => {
      if (cancelled) return
      const extras = stats
        .filter((s) => !cityMap[s.cityId] && s.venueCount > 0 && Number.isFinite(s.centerLat))
        .map(dynamicCity)
        .sort((a, b) => a.name.localeCompare(b.name))
      setDynamicCities(extras)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // On first load, detect the user's location: expose it for nearest-first
  // sorting, and — if they've never explicitly chosen a city — default to the
  // nearest supported city instead of London.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    let hasSavedCity = false
    try {
      hasSavedCity = Boolean(localStorage.getItem(KEY))
    } catch {
      /* ignore */
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setUserLocation(loc)
        if (!hasSavedCity) {
          // Auto-select nearest, but don't persist it — it's a default, not a choice.
          setCityId(nearestCity(loc[0], loc[1]).id)
        }
      },
      () => {
        /* permission denied / unavailable — keep the default city */
      },
      { timeout: 8000, maximumAge: 300_000 },
    )
  }, [])

  const cities = useMemo(() => [...staticCities, ...dynamicCities], [dynamicCities])
  const city = useMemo(
    () => cities.find((c) => c.id === cityId) ?? cityMap[DEFAULT_CITY],
    [cities, cityId],
  )

  return (
    <CityContext.Provider value={{ cityId, city, setCity, cities, userLocation }}>
      {children}
    </CityContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCity(): CityValue {
  const ctx = useContext(CityContext)
  if (!ctx) throw new Error('useCity must be used within CityProvider')
  return ctx
}
