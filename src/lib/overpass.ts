/**
 * OpenStreetMap Overpass API client.
 * Queries named amenities within an OSM area and parses them into
 * the app's Business shape (with source:'osm').
 */

import type { Business, CategoryId, OpeningHours } from '../data/types'

// Which OSM amenity values map to our categories
const AMENITY_TO_CATEGORY: Record<string, CategoryId> = {
  restaurant:     'restaurants',
  fast_food:      'restaurants',
  cafe:           'cafes',
  bar:            'bars',
  nightclub:      'nightlife',
  pub:            'pubs',
  hairdresser:    'salons',
  beauty:         'beauty',
  gym:            'gyms',
  fitness_centre: 'gyms',
  spa:            'spas',
  hotel:          'hotels',
}

// Human-readable labels for OSM attraction tag values
const TOURISM_LABEL: Record<string, string> = {
  attraction:           'Attraction',
  museum:               'Museum',
  gallery:              'Gallery',
  aquarium:             'Aquarium',
  zoo:                  'Zoo',
  theme_park:           'Theme Park',
  viewpoint:            'Viewpoint',
}
const HISTORIC_LABEL: Record<string, string> = {
  castle:               'Castle',
  monument:             'Monument',
}
const LEISURE_LABEL: Record<string, string> = {
  park:                 'Park',
  marina:               'Marina',
  nature_reserve:       'Nature Reserve',
}
// man_made tags that are attractions (piers, lighthouses, etc.)
const MANMADE_LABEL: Record<string, string> = {
  pier:                 'Pier',
  lighthouse:           'Lighthouse',
  windmill:             'Windmill',
}

// OSM day abbreviation → full name index (Sunday=0 like JS Date)
const DAY_INDEX: Record<string, number> = {
  Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0,
}
const INDEX_TO_DAY = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const ALL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

/** Parse an OSM opening_hours string into our OpeningHours[] format. */
function parseOpeningHours(raw: string | undefined): OpeningHours[] {
  if (!raw) return []

  const result: Record<string, { open: string; close: string }> = {}

  if (raw.trim() === '24/7') {
    ALL_DAYS.forEach((d) => { result[d] = { open: '00:00', close: '24:00' } })
    return ALL_DAYS.map((day) => ({ day, ...result[day] }))
  }

  // Split by ";" into rules, ignoring week numbers and complex modifiers
  const rules = raw.split(';').map((s) => s.trim()).filter(Boolean)

  for (const rule of rules) {
    // Try to match: DAYS TIME or "DAYS off"
    const match = rule.match(
      /^([A-Z][a-z](?:-[A-Z][a-z])?)(?:,([A-Z][a-z](?:-[A-Z][a-z])?))*\s+(.+)$/,
    )
    if (!match) continue

    const timesPart = rule.slice(rule.search(/\d\d:\d\d|off/)).trim()
    const daysPart  = rule.slice(0, rule.search(/\d\d:\d\d|off/)).trim()

    // Expand day ranges/lists
    const daysStr = daysPart.replace(/\s/g, '')
    const dayTokens = daysStr.split(',')
    const expandedDays: string[] = []

    for (const tok of dayTokens) {
      const range = tok.match(/^([A-Z][a-z])-([A-Z][a-z])$/)
      if (range) {
        const from = DAY_INDEX[range[1]]
        const to   = DAY_INDEX[range[2]]
        if (from == null || to == null) continue
        // Expand Mo-Fr → Mon…Fri (in week order, Mo=1..Su=0)
        const week = [1,2,3,4,5,6,0]
        const fi = week.indexOf(from), ti = week.indexOf(to)
        if (fi <= ti) {
          week.slice(fi, ti + 1).forEach((i) => expandedDays.push(INDEX_TO_DAY[i]))
        }
      } else if (DAY_INDEX[tok] != null) {
        expandedDays.push(INDEX_TO_DAY[DAY_INDEX[tok]])
      }
    }

    if (timesPart === 'off') {
      expandedDays.forEach((d) => { result[d] = { open: 'Closed', close: '' } })
      continue
    }

    // Take first time range (handles "12:00-14:30,18:00-22:00" → "12:00-14:30")
    const timeMatch = timesPart.match(/(\d\d:\d\d)-(\d\d:\d\d)/)
    if (!timeMatch) continue
    expandedDays.forEach((d) => {
      result[d] = { open: timeMatch[1], close: timeMatch[2] }
    })
  }

  return ALL_DAYS.map((day) =>
    result[day]
      ? { day, open: result[day].open, close: result[day].close }
      : { day, open: 'Closed', close: '' },
  )
}

/** Derive business tags from OSM tags */
function parseTags(tags: Record<string, string>): string[] {
  const out: string[] = []
  if (tags.cuisine)                           out.push(capitalise(tags.cuisine.replace(/_/g, ' ')))
  if (tags['outdoor_seating'] === 'yes')      out.push('Outdoor seating')
  if (tags['diet:vegetarian'] === 'yes')      out.push('Vegetarian friendly')
  if (tags['diet:vegan']      === 'yes')      out.push('Vegan options')
  if (tags['dog']             === 'yes' ||
      tags['dogs']            === 'yes')      out.push('Dog friendly')
  if (tags['takeaway']        === 'yes')      out.push('Takeaway')
  if (tags['internet_access'] === 'wlan' ||
      tags['internet_access'] === 'yes'  ||
      tags['wifi']            === 'yes')      out.push('Free WiFi')
  if (tags['live_music']      === 'yes')      out.push('Live music')
  if (tags['real_ale']        === 'yes')      out.push('Real ale')
  if (tags['brewery'])                        out.push('Brewery')
  if (tags['microbrewery']    === 'yes')      out.push('Microbrewery')
  if (tags['garden']          === 'yes')      out.push('Beer garden')
  if (tags['rooftop']         === 'yes')      out.push('Rooftop')
  return out.slice(0, 6)
}

/** Derive amenities list from OSM tags */
function parseAmenities(tags: Record<string, string>): string[] {
  const out: string[] = []
  if (tags['wheelchair'] === 'yes')           out.push('Wheelchair accessible')
  if (tags['internet_access'] === 'wlan' ||
      tags['internet_access'] === 'yes'  ||
      tags['wifi']            === 'yes')      out.push('Free WiFi')
  if (tags['outdoor_seating'] === 'yes')      out.push('Outdoor seating')
  if (tags['dog'] === 'yes' ||
      tags['dogs'] === 'yes')                 out.push('Dog friendly')
  if (tags['live_music'] === 'yes')           out.push('Live music')
  if (tags['air_conditioning'] === 'yes')     out.push('Air conditioning')
  if (tags['smoking'] === 'outside' ||
      tags['smoking'] === 'separated')        out.push('Smoking area')
  if (tags['capacity'])                       out.push(`Seats ${tags['capacity']}`)
  return out
}

/** Build a short description from available OSM tags */
function buildDescription(
  tags: Record<string, string>,
  category: string,
  nb: string,
): { short: string; long: string } {
  const desc  = tags['description'] ?? tags['short_description'] ?? ''
  const brand = tags['brand'] ?? tags['operator'] ?? ''
  const cuisine = tags['cuisine'] ? capitalise(tags['cuisine'].replace(/_/g, ' ')) : ''

  let short = desc.slice(0, 160)
  if (!short && cuisine) short = `${cuisine} in ${nb}`
  if (!short && brand)   short = `${brand} in ${nb}`
  if (!short)            short = `${capitalise(category.replace(/_/g, ' '))} in ${nb}`

  return { short, long: desc }
}

// ─── Placeholder photos ────────────────────────────────────────────────────────
// Curated Unsplash photo IDs per category — stable, no API key needed.
const PLACEHOLDER_PHOTOS: Record<string, string[]> = {
  restaurants: [
    'photo-1414235077428-338989a2e8c0',
    'photo-1517248135467-4c7edcad34c4',
    'photo-1466978913421-dad2ebd01d17',
    'photo-1555396273-367ea4eb4db5',
    'photo-1424847651672-bf20a4b0982b',
    'photo-1544025162-d76694265947',
  ],
  cafes: [
    'photo-1501339847302-ac426a4a7cbb',
    'photo-1495474472287-4d71bcdd2085',
    'photo-1509042239860-f550ce710b93',
    'photo-1442512595331-e89e73853f31',
    'photo-1453614512568-c4024d13c247',
  ],
  pubs: [
    'photo-1514362545857-3bc16c4c7d1b',
    'photo-1436076863939-06870fe779c2',
    'photo-1574096079513-d8259312b785',
    'photo-1559526324-593bc073d938',
    'photo-1567696153798-9111f9cd3d0d',
  ],
  bars: [
    'photo-1543007630-9710e4a00a20',
    'photo-1470337458703-46ad1756a187',
    'photo-1551024709-8f23befc6f87',
    'photo-1572116469696-31de0f17cc34',
  ],
  nightlife: [
    'photo-1516450360452-9312f5e86fc7',
    'photo-1574375927938-d5a98e8ffe85',
    'photo-1598387846148-47e82ee120cc',
  ],
  salons: [
    'photo-1560066984-138dadb4c035',
    'photo-1522337360788-8b13dee7a37e',
    'photo-1562322140-8baeececf3df',
    'photo-1521590832167-7bcbfaa6381f',
  ],
  beauty: [
    'photo-1487412947147-5cebf100d293',
    'photo-1596704017254-9b121068fb31',
    'photo-1570172619644-dfd03ed5d881',
  ],
  gyms: [
    'photo-1534438327276-14e5300c3a48',
    'photo-1571019614242-c5c5dee9f50b',
    'photo-1574680096145-d05b474e2155',
    'photo-1517836357463-d25dfeac3438',
  ],
  fitness: [
    'photo-1534438327276-14e5300c3a48',
    'photo-1571019614242-c5c5dee9f50b',
  ],
  spas: [
    'photo-1540555700478-4be289fbecef',
    'photo-1544161515-4ab6ce6db874',
    'photo-1600334089648-b0d9d3028eb2',
    'photo-1519823551278-64ac92734fb1',
  ],
  hotels: [
    'photo-1566073771259-6a8506099945',
    'photo-1520250497591-112f2f40a3f4',
    'photo-1582719508461-905c673536f7',
    'photo-1455587734955-081b22074882',
  ],
  shopping: [
    'photo-1441986300917-64674bd600d8',
    'photo-1472851294608-062f824d29cc',
  ],
  activities: [
    'photo-1526401485004-46910ecc8e51',
    'photo-1541534741688-6078c6bfb5c5',
  ],
  entertainment: [
    'photo-1489599849927-2ee91cede3ba',
    'photo-1514525253161-7a46d19cd819',
  ],
  attractions: [
    'photo-1488646953014-85cb44e25828', // pier / seaside
    'photo-1526401485004-46910ecc8e51', // outdoor / landscape
    'photo-1489599849927-2ee91cede3ba', // heritage / museum
    'photo-1541534741688-6078c6bfb5c5', // park / nature
    'photo-1476514525535-07fb3b4ae5f1', // lake / open air
    'photo-1464822759023-fed622ff2c3b', // countryside / reserve
  ],
}

const UNSPLASH_BASE = 'https://images.unsplash.com'

/** Pick a stable placeholder photo URL for a given category + OSM element ID */
function placeholderPhoto(category: string, osmNumericId: number): string {
  const pool = PLACEHOLDER_PHOTOS[category] ?? PLACEHOLDER_PHOTOS.restaurants
  const photoId = pool[osmNumericId % pool.length]
  return `${UNSPLASH_BASE}/${photoId}?w=800&q=80&fit=crop&auto=format`
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Slugify a string for use as a URL-safe identifier */
function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** Derive neighbourhood from OSM address tags */
function neighbourhood(tags: Record<string, string>): string {
  return (
    tags['addr:suburb']   ||
    tags['addr:city']     ||
    tags['addr:town']     ||
    tags['addr:village']  ||
    tags['addr:hamlet']   ||
    'West Sussex'
  )
}

/** Build a full address string from OSM tags */
function address(tags: Record<string, string>): string {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
  ].filter(Boolean)
  return parts.join(', ') || 'Address not listed'
}

/** Derive tags relevant to an attraction from OSM data */
function parseAttractionTags(tags: Record<string, string>): string[] {
  const out: string[] = []
  if (tags['fee'] === 'no' || tags['charge'] === 'no') out.push('Free entry')
  if (tags['fee'] === 'yes') out.push('Admission charged')
  if (tags['fee'] === 'donation') out.push('Donation welcome')
  if (tags['wheelchair'] === 'yes') out.push('Wheelchair accessible')
  if (tags['dog'] === 'yes' || tags['dogs'] === 'yes') out.push('Dog friendly')
  if (tags['internet_access'] === 'wlan' || tags['wifi'] === 'yes') out.push('Free WiFi')
  if (tags['outdoor_seating'] === 'yes') out.push('Outdoor seating')
  if (tags['access'] === 'private' || tags['access'] === 'restricted') out.push('Restricted access')
  return out.slice(0, 6)
}

/** Derive amenities for attractions */
function parseAttractionAmenities(tags: Record<string, string>): string[] {
  const out: string[] = []
  if (tags['wheelchair'] === 'yes') out.push('Wheelchair accessible')
  if (tags['dog'] === 'yes' || tags['dogs'] === 'yes') out.push('Dog friendly')
  if (tags['toilets'] === 'yes' || tags['toilets:disposal']) out.push('Toilets on site')
  if (tags['parking'] === 'yes' || tags['parking'] === 'surface') out.push('Car parking')
  if (tags['guided_tours'] === 'yes') out.push('Guided tours available')
  if (tags['cafe'] === 'yes' || tags['restaurant'] === 'yes') out.push('On-site café')
  if (tags['shop'] === 'yes' || tags['gift_shop'] === 'yes') out.push('Gift shop')
  if (tags['picnic_site'] === 'yes' || tags['picnic'] === 'yes') out.push('Picnic area')
  return out
}

/** Build description for an attraction */
function buildAttractionDescription(
  tags: Record<string, string>,
  attractionType: string,
  name: string,
  nb: string,
): { short: string; long: string } {
  const desc = tags['description'] ?? tags['short_description'] ?? ''
  let short = desc.slice(0, 160)
  if (!short) short = `${attractionType} in ${nb}`
  const long = desc || `${name} is a ${attractionType.toLowerCase()} located in ${nb}.`
  return { short, long }
}

// ─── OSM element shape ────────────────────────────────────────────────────────

interface OsmElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags: Record<string, string>
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface OsmVenue extends Omit<Business,
  'rating' | 'reviewCount' | 'scores' | 'rank' | 'featured' | 'popularDishes' | 'ownerId'
> {
  osmId: string
  source: 'osm'
  claimed: false
}

/** Supported area names → OSM area query string */
const AREA_QUERIES: Record<string, string> = {
  'west-sussex':  'area["name"="West Sussex"]["admin_level"="6"]->.a',
  'london':       'area["name"="Greater London"]["admin_level"="4"]->.a',
  'manchester':   'area["name"="Greater Manchester"]["admin_level"="6"]->.a',
  'birmingham':   'area["name"="Birmingham"]["admin_level"="8"]->.a',
  'bournemouth':  'area["name"="Bournemouth"]["admin_level"="8"]->.a',
  'southampton':  'area["name"="Southampton"]["admin_level"="8"]->.a',
  // West Sussex towns — narrower areas so a single import covers the town
  // thoroughly instead of being diluted across the whole county.
  'worthing':      'area["name"="Worthing"]["admin_level"="8"]->.a',
  'chichester':    'area["name"="Chichester"]["admin_level"="8"]->.a',
  'crawley':       'area["name"="Crawley"]["admin_level"="8"]->.a',
  'horsham':       'area["name"="Horsham"]["admin_level"="8"]->.a',
  'arun':          'area["name"="Arun"]["admin_level"="8"]->.a', // Bognor Regis + Littlehampton
}

/**
 * England's ceremonial counties — the unit we import at when rolling out
 * nationally. Each is a single Overpass query of similar size to the West
 * Sussex import that already works. Offered as suggestions for custom imports.
 */
export const ENGLAND_COUNTIES = [
  'Bedfordshire', 'Berkshire', 'Bristol', 'Buckinghamshire', 'Cambridgeshire',
  'Cheshire', 'Cornwall', 'Cumbria', 'Derbyshire', 'Devon', 'Dorset', 'Durham',
  'East Riding of Yorkshire', 'East Sussex', 'Essex', 'Gloucestershire',
  'Greater London', 'Greater Manchester', 'Hampshire', 'Herefordshire',
  'Hertfordshire', 'Isle of Wight', 'Kent', 'Lancashire', 'Leicestershire',
  'Lincolnshire', 'Merseyside', 'Norfolk', 'North Yorkshire', 'Northamptonshire',
  'Northumberland', 'Nottinghamshire', 'Oxfordshire', 'Rutland', 'Shropshire',
  'Somerset', 'South Yorkshire', 'Staffordshire', 'Suffolk', 'Surrey',
  'Tyne and Wear', 'Warwickshire', 'West Midlands', 'West Sussex',
  'West Yorkshire', 'Wiltshire', 'Worcestershire',
] as const

/**
 * Resolve an import key to an Overpass area selector. Known keys use their
 * hand-tuned query; anything else is treated as a literal OSM area name
 * (county, district or town), matched across the administrative levels used
 * in England (4 = nation/region, 5 = Greater London, 6 = county, 8 = district).
 */
function areaQueryFor(key: string): string | null {
  if (AREA_QUERIES[key]) return AREA_QUERIES[key]
  const name = key.replace(/["\\]/g, '').trim()
  if (!name) return null
  return `area["name"="${name}"]["boundary"="administrative"]["admin_level"~"^[4-8]$"]->.a`
}

/**
 * Some importable areas are towns that belong to a parent city in the app's
 * city model (e.g. Worthing → West Sussex). Imported venues are stored under
 * the parent so they show in the right city view; outreach still filters by
 * the venue's own neighbourhood/address.
 */
const AREA_PARENT: Record<string, { cityId: string; cityName: string }> = {
  worthing:   { cityId: 'west-sussex', cityName: 'West Sussex' },
  chichester: { cityId: 'west-sussex', cityName: 'West Sussex' },
  crawley:    { cityId: 'west-sussex', cityName: 'West Sussex' },
  horsham:    { cityId: 'west-sussex', cityName: 'West Sussex' },
  arun:       { cityId: 'west-sussex', cityName: 'West Sussex' },
}

/** Resolve an import-area key to the city it should be stored under.
 *  Custom areas (e.g. "East Sussex", "Kent") get a slugified city id —
 *  add a matching entry to data/cities.ts to surface them in the city picker. */
export function resolveParentCity(areaKey: string): { cityId: string; cityName: string } {
  if (AREA_PARENT[areaKey]) return AREA_PARENT[areaKey]
  if (AREA_QUERIES[areaKey]) {
    return {
      cityId: areaKey,
      cityName: areaKey === 'west-sussex' ? 'West Sussex' : capitalise(areaKey),
    }
  }
  const name = areaKey.replace(/["\\]/g, '').trim()
  return {
    cityId: name.toLowerCase().replace(/\s+/g, '-'),
    cityName: name,
  }
}

// Note: no extra quotes around this — it gets interpolated as [amenity~"..."]
const AMENITY_FILTER =
  `amenity~"^(restaurant|cafe|bar|pub|fast_food|hairdresser|beauty|gym|fitness_centre|spa|hotel)$"`

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]

// HTTP statuses that mean "busy/overloaded, try again" rather than a real failure
const TRANSIENT_STATUS = new Set([429, 502, 503, 504])

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function overpassPost(query: string): Promise<{ elements: OsmElement[] }> {
  let lastErr: Error = new Error('No mirrors available')
  const RETRIES_PER_MIRROR = 2 // 3 attempts per mirror

  for (const url of OVERPASS_MIRRORS) {
    for (let attempt = 0; attempt <= RETRIES_PER_MIRROR; attempt++) {
      // Each attempt gets its own AbortController so a hang doesn't block forever.
      const controller = new AbortController()
      const timer = window.setTimeout(() => controller.abort(), 90_000)
      try {
        const res = await fetch(url, {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          signal: controller.signal,
        })
        clearTimeout(timer)

        // Transient overload (gateway timeout / rate limit) — back off and retry
        // this mirror, then fall through to the next one.
        if (TRANSIENT_STATUS.has(res.status)) {
          lastErr = new Error(`Overpass HTTP ${res.status} (server busy)`)
          if (attempt < RETRIES_PER_MIRROR) {
            await sleep(1500 * (attempt + 1)) // 1.5s, 3s
            continue
          }
          break // give up on this mirror, try the next
        }

        if (!res.ok) {
          let body = ''
          try { body = (await res.text()).slice(0, 200) } catch { /* ignore */ }
          throw new Error(`Overpass HTTP ${res.status}${body ? ` — ${body}` : ''}`)
        }
        return (await res.json()) as { elements: OsmElement[] }
      } catch (e) {
        clearTimeout(timer)
        if (e instanceof DOMException && e.name === 'AbortError') {
          lastErr = new Error('Overpass request timed out — the server may be busy, try again')
          if (attempt < RETRIES_PER_MIRROR) { await sleep(1000 * (attempt + 1)); continue }
        } else {
          lastErr = e instanceof Error ? e : new Error(String(e))
        }
        break // non-transient error — move to next mirror
      }
    }
  }
  throw new Error(`${lastErr.message}. All Overpass mirrors are busy — wait a moment and try again (and avoid running the venue and attractions imports at the same time).`)
}

/**
 * Query Overpass for all named amenity venues within a city area.
 * Returns up to `limit` parsed venue objects ready to preview/import.
 */
export async function fetchOSMVenues(
  cityId: string,
  limit = 400,
): Promise<{ venues: OsmVenue[]; error?: string }> {
  const areaQuery = areaQueryFor(cityId)
  if (!areaQuery) return { venues: [], error: `Enter a valid area name (e.g. "Kent" or "East Sussex")` }

  const query = `
[out:json][timeout:60];
${areaQuery};
(
  node[${AMENITY_FILTER}]["name"](area.a);
  way[${AMENITY_FILTER}]["name"](area.a);
);
out center tags ${limit};
`.trim()

  let data: { elements: OsmElement[] }
  try {
    data = await overpassPost(query)
  } catch (e) {
    return { venues: [], error: e instanceof Error ? e.message : String(e) }
  }

  const venues: OsmVenue[] = []
  const parent = resolveParentCity(cityId)

  for (const el of data.elements) {
    const t = el.tags ?? {}
    const name = t.name
    if (!name) continue

    const amenity = t.amenity
    const category = AMENITY_TO_CATEGORY[amenity]
    if (!category) continue

    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    if (!lat || !lon) continue

    const osmId  = `${el.type}/${el.id}`
    const slug   = `${slugify(name)}-osm-${el.id}`
    const nb     = neighbourhood(t)
    const hours  = parseOpeningHours(t.opening_hours)
    const { short, long } = buildDescription(t, amenity, nb)
    const cuisine = t.cuisine ? capitalise(t.cuisine.replace(/_/g, ' ')) : undefined

    // Real image from OSM if available, otherwise stable category placeholder
    const osmImage = t.image || t['wikimedia_commons:image'] || ''
    const heroImage = osmImage || placeholderPhoto(category, el.id)

    // Price level: derive from OSM fee/stars or default to 2
    const stars = parseInt(t['stars'] ?? t['hotel:stars'] ?? '0', 10)
    const priceLevel: 1|2|3|4 =
      stars >= 4 ? 4 : stars >= 3 ? 3 :
      t['price_range'] === 'cheap' ? 1 :
      t['price_range'] === 'upscale' ? 4 : 2

    venues.push({
      id:               `osm-${el.id}`,
      osmId,
      slug,
      name,
      source:           'osm',
      claimed:          false,
      category,
      cuisine,
      tags:             parseTags(t),
      priceLevel,
      neighbourhood:    nb,
      city:             parent.cityName,
      cityId:           parent.cityId,
      address:          address(t),
      postcode:         t['addr:postcode'] ?? '',
      phone:            t.phone ?? t['contact:phone'] ?? '',
      website:          t.website ?? t['contact:website'] ?? '',
      email:            t.email ?? t['contact:email'] ?? '',
      heroImage,
      images:           [],
      shortDescription: short,
      description:      long,
      hours,
      openNow:          false,
      amenities:        parseAmenities(t),
      bookable:         ['restaurants','gyms','spas','salons','hotels'].includes(category),
      delivers:         t['delivery'] === 'yes',
      lat,
      lng:              lon,
    })
  }

  return { venues }
}

/**
 * Query Overpass for named attractions (parks, piers, museums, castles, etc.)
 * within a city area. Uses tourism/historic/leisure/natural keys rather than amenity.
 *
 * To avoid Overpass timeouts on large areas we split the query into one small
 * request per tag-group and merge the results. Each sub-query is fast; a single
 * combined query across all tag types reliably times out for county-sized areas.
 */
export async function fetchOSMAttractions(
  cityId: string,
  limit = 300,
  onProgress?: (done: number, total: number) => void,
): Promise<{ venues: OsmVenue[]; error?: string }> {
  const areaQuery = areaQueryFor(cityId)
  if (!areaQuery) return { venues: [], error: `Enter a valid area name (e.g. "Kent" or "East Sussex")` }

  // leisure=park intentionally excluded — matches thousands of pocket greens in cities
  // and reliably causes timeouts. Notable parks appear via tourism=attraction.
  const subQueryDefs = [
    { label: 'tourism',  q: `node[tourism~"^(attraction|museum|gallery|aquarium|zoo|theme_park|viewpoint)$"]["name"](area.a);\n  way[tourism~"^(attraction|museum|gallery|aquarium|zoo|theme_park|viewpoint)$"]["name"](area.a);` },
    { label: 'historic', q: `node[historic~"^(castle|monument)$"]["name"](area.a);\n  way[historic~"^(castle|monument)$"]["name"](area.a);` },
    { label: 'leisure',  q: `node[leisure~"^(marina|nature_reserve)$"]["name"](area.a);\n  way[leisure~"^(marina|nature_reserve)$"]["name"](area.a);` },
    { label: 'man_made', q: `node[man_made~"^(pier|lighthouse|windmill)$"]["name"](area.a);\n  way[man_made~"^(pier|lighthouse|windmill)$"]["name"](area.a);` },
    { label: 'natural',  q: `node[natural=beach]["name"](area.a);\n  way[natural=beach]["name"](area.a);` },
  ]

  const allElements: OsmElement[] = []
  const subErrors: string[] = []

  for (let i = 0; i < subQueryDefs.length; i++) {
    onProgress?.(i, subQueryDefs.length)
    const { label, q } = subQueryDefs[i]
    const query = `[out:json][timeout:60];\n${areaQuery};\n(\n  ${q}\n);\nout center tags 200;`
    try {
      const data = await overpassPost(query)
      allElements.push(...data.elements)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn(`Attractions sub-query (${label}) failed:`, msg)
      subErrors.push(`${label}: ${msg}`)
    }
  }
  onProgress?.(subQueryDefs.length, subQueryDefs.length)

  // If every sub-query failed, return an error
  if (subErrors.length === subQueryDefs.length) {
    return { venues: [], error: subErrors[0] }
  }

  // Cap total results
  const venues: OsmVenue[] = []
  const seenIds = new Set<string>()
  const parent = resolveParentCity(cityId)

  for (const el of allElements.slice(0, limit)) {
    const t = el.tags ?? {}
    const name = t.name
    if (!name) continue

    // De-duplicate — ways and their constituent nodes can appear twice
    const osmId = `${el.type}/${el.id}`
    if (seenIds.has(name + osmId)) continue
    seenIds.add(name + osmId)

    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    if (!lat || !lon) continue

    // Determine the human-readable attraction type
    const attractionType =
      TOURISM_LABEL[t.tourism ?? ''] ||
      HISTORIC_LABEL[t.historic ?? ''] ||
      LEISURE_LABEL[t.leisure ?? ''] ||
      MANMADE_LABEL[t.man_made ?? ''] ||
      (t.natural === 'beach' ? 'Beach' : 'Attraction')

    const slug   = `${slugify(name)}-osm-${el.id}`
    const nb     = neighbourhood(t)
    const hours  = parseOpeningHours(t.opening_hours)
    const { short, long } = buildAttractionDescription(t, attractionType, name, nb)
    const tags   = parseAttractionTags(t)
    const freeEntry = t['fee'] === 'no' || t['charge'] === 'no' || t['fee'] === 'free'

    const osmImage = t.image || t['wikimedia_commons:image'] || ''
    const heroImage = osmImage || placeholderPhoto('attractions', el.id)

    venues.push({
      id:               `osm-${el.id}`,
      osmId,
      slug,
      name,
      source:           'osm',
      claimed:          false,
      category:         'attractions',
      // Reuse cuisine field to surface the attraction type (Park, Museum, etc.)
      cuisine:          attractionType,
      tags,
      freeEntry,
      priceLevel:       1,
      neighbourhood:    nb,
      city:             parent.cityName,
      cityId:           parent.cityId,
      address:          address(t),
      postcode:         t['addr:postcode'] ?? '',
      phone:            t.phone ?? t['contact:phone'] ?? '',
      website:          t.website ?? t['contact:website'] ?? '',
      email:            t.email ?? t['contact:email'] ?? '',
      heroImage,
      images:           [],
      shortDescription: short,
      description:      long,
      hours,
      openNow:          false,
      amenities:        parseAttractionAmenities(t),
      bookable:         false,
      delivers:         false,
      lat,
      lng:              lon,
    })
  }

  return { venues }
}
