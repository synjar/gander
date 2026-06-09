export interface City {
  id: string
  name: string
  lat: number
  lng: number
  zoom: number
  neighbourhoods: string[]
  blurb: string
}

export const cities: City[] = [
  {
    id: 'london',
    name: 'London',
    lat: 51.5074,
    lng: -0.1278,
    zoom: 12,
    blurb: 'The capital’s best tables, bars and bolt-holes',
    neighbourhoods: [
      'Soho',
      'Shoreditch',
      'Camden',
      'Covent Garden',
      'Notting Hill',
      'Borough',
      'Islington',
      'Mayfair',
      'Brixton',
      'Hackney',
      'Peckham',
      'Clerkenwell',
      'Fitzrovia',
      'Bloomsbury',
    ],
  },
  {
    id: 'bournemouth',
    name: 'Bournemouth',
    lat: 50.7192,
    lng: -1.8808,
    zoom: 13,
    blurb: 'Seven miles of beach, and the spots locals love',
    neighbourhoods: [
      'Town Centre',
      'Boscombe',
      'Westbourne',
      'Southbourne',
      'Pokesdown',
      'Charminster',
      'Poole',
    ],
  },
  {
    id: 'southampton',
    name: 'Southampton',
    lat: 50.9097,
    lng: -1.4044,
    zoom: 13,
    blurb: 'Waterfront dining and a buzzing city centre',
    neighbourhoods: [
      'Old Town',
      'Ocean Village',
      'Bedford Place',
      'Portswood',
      'Bevois Valley',
      'Oxford Street',
      'Shirley',
    ],
  },
  {
    id: 'west-sussex',
    name: 'West Sussex',
    lat: 50.92,
    lng: -0.46,
    zoom: 10,
    blurb: 'From the South Downs to the seaside',
    neighbourhoods: [
      'Chichester',
      'Worthing',
      'Horsham',
      'Arundel',
      'Bognor Regis',
      'Crawley',
      'Midhurst',
      'Shoreham-by-Sea',
    ],
  },
]

export const cityMap: Record<string, City> = Object.fromEntries(
  cities.map((c) => [c.id, c]),
)

export const DEFAULT_CITY = 'london'

/** Pick the supported city closest to a lat/lng (squared distance is fine here). */
export function nearestCity(lat: number, lng: number): City {
  let best = cities[0]
  let bestD = Infinity
  for (const c of cities) {
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  return best
}

/** 'West Sussex' -> 'west-sussex', 'London' -> 'london' */
export function cityIdFromName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}
