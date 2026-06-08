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
  if (tags.cuisine)            out.push(capitalise(tags.cuisine.replace(/_/g, ' ')))
  if (tags['outdoor_seating'] === 'yes') out.push('Outdoor seating')
  if (tags['diet:vegetarian'] === 'yes') out.push('Vegetarian friendly')
  if (tags['diet:vegan']      === 'yes') out.push('Vegan options')
  if (tags['dog']             === 'yes') out.push('Dog friendly')
  if (tags['takeaway']        === 'yes') out.push('Takeaway')
  return out.slice(0, 4)
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
}

// Note: no extra quotes around this — it gets interpolated as [amenity~"..."]
const AMENITY_FILTER =
  `amenity~"^(restaurant|cafe|bar|pub|fast_food|hairdresser|beauty|gym|fitness_centre|spa|hotel)$"`

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

async function overpassPost(query: string): Promise<{ elements: OsmElement[] }> {
  let lastErr: Error = new Error('No mirrors available')
  for (const url of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      if (!res.ok) throw new Error(`Overpass returned HTTP ${res.status}`)
      return await res.json() as { elements: OsmElement[] }
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e))
    }
  }
  throw lastErr
}

/**
 * Query Overpass for all named amenity venues within a city area.
 * Returns up to `limit` parsed venue objects ready to preview/import.
 */
export async function fetchOSMVenues(
  cityId: string,
  limit = 400,
): Promise<{ venues: OsmVenue[]; error?: string }> {
  const areaQuery = AREA_QUERIES[cityId]
  if (!areaQuery) return { venues: [], error: `No Overpass query defined for city: ${cityId}` }

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

    const osmId = `${el.type}/${el.id}`
    const slug  = `${slugify(name)}-osm-${el.id}`
    const nb    = neighbourhood(t)
    const hours = parseOpeningHours(t.opening_hours)

    venues.push({
      id:               `osm-${el.id}`,
      osmId,
      slug,
      name,
      source:           'osm',
      claimed:          false,
      category,
      cuisine:          t.cuisine ? capitalise(t.cuisine.replace(/_/g, ' ')) : undefined,
      tags:             parseTags(t),
      priceLevel:       2,
      neighbourhood:    nb,
      city:             cityId === 'west-sussex' ? 'West Sussex' : cityId,
      cityId,
      address:          address(t),
      postcode:         t['addr:postcode'] ?? '',
      phone:            t.phone ?? t['contact:phone'] ?? '',
      website:          t.website ?? t['contact:website'] ?? '',
      heroImage:        '',
      images:           [],
      shortDescription: '',
      description:      '',
      hours,
      openNow:          false, // computed dynamically by getOpenStatus
      amenities:        [],
      bookable:         false,
      delivers:         false,
      lat,
      lng:              lon,
    })
  }

  return { venues }
}
