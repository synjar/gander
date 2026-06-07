import { createContext, useContext, useState, type ReactNode } from 'react'
import { cityMap, DEFAULT_CITY, type City } from '../data/cities'

const KEY = 'gander.city'

interface CityValue {
  cityId: string
  city: City
  setCity: (id: string) => void
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

  function setCity(id: string) {
    setCityId(id)
    try {
      localStorage.setItem(KEY, id)
    } catch {
      /* ignore */
    }
  }

  const city = cityMap[cityId] ?? cityMap[DEFAULT_CITY]

  return (
    <CityContext.Provider value={{ cityId, city, setCity }}>{children}</CityContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCity(): CityValue {
  const ctx = useContext(CityContext)
  if (!ctx) throw new Error('useCity must be used within CityProvider')
  return ctx
}
