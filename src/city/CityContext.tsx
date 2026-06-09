import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { cityMap, DEFAULT_CITY, nearestCity, type City } from '../data/cities'

const KEY = 'gander.city'

interface CityValue {
  cityId: string
  city: City
  setCity: (id: string) => void
  /** The user's detected location, once geolocation resolves (else null). */
  userLocation: [number, number] | null
}

const CityContext = createContext<CityValue | null>(null)

export function CityProvider({ children }: { children: ReactNode }) {
  const [cityId, setCityId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(KEY)
      return saved && cityMap[saved] ? saved : DEFAULT_CITY
    } catch {
      return DEFAULT_CITY
    }
  })
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  function setCity(id: string) {
    setCityId(id)
    try {
      localStorage.setItem(KEY, id)
    } catch {
      /* ignore */
    }
  }

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

  const city = cityMap[cityId] ?? cityMap[DEFAULT_CITY]

  return (
    <CityContext.Provider value={{ cityId, city, setCity, userLocation }}>{children}</CityContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCity(): CityValue {
  const ctx = useContext(CityContext)
  if (!ctx) throw new Error('useCity must be used within CityProvider')
  return ctx
}
