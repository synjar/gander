/**
 * Deterministic seed-review generator for OSM-imported venues.
 * Given a Business, returns 2–6 realistic-sounding reviews.
 * The same business always gets the same reviews (seeded by business ID).
 */

import type { Business } from '../data/types'

// ─── Deterministic PRNG ───────────────────────────────────────────────────────

function strSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function makePrng(seed: number) {
  let s = seed
  return function rng(): number {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5)
  return shuffled.slice(0, n)
}

// ─── Reviewer personas ────────────────────────────────────────────────────────
// Fixed fake UUIDs (won't collide with real auth.users)

const PERSONAS: Array<{ id: string; name: string; level: number }> = [
  { id: 'aaaaaaaa-0001-4000-8000-bbbbbbbbbb01', name: 'Sarah M.',    level: 2 },
  { id: 'aaaaaaaa-0002-4000-8000-bbbbbbbbbb02', name: 'James T.',    level: 1 },
  { id: 'aaaaaaaa-0003-4000-8000-bbbbbbbbbb03', name: 'Emma P.',     level: 3 },
  { id: 'aaaaaaaa-0004-4000-8000-bbbbbbbbbb04', name: 'Oliver H.',   level: 2 },
  { id: 'aaaaaaaa-0005-4000-8000-bbbbbbbbbb05', name: 'Charlotte D.', level: 1 },
  { id: 'aaaaaaaa-0006-4000-8000-bbbbbbbbbb06', name: 'Mo A.',       level: 2 },
  { id: 'aaaaaaaa-0007-4000-8000-bbbbbbbbbb07', name: 'Fiona C.',    level: 3 },
  { id: 'aaaaaaaa-0008-4000-8000-bbbbbbbbbb08', name: 'Dan W.',      level: 1 },
  { id: 'aaaaaaaa-0009-4000-8000-bbbbbbbbbb09', name: 'Priya S.',    level: 2 },
  { id: 'aaaaaaaa-0010-4000-8000-bbbbbbbbbb10', name: 'Tom G.',      level: 1 },
  { id: 'aaaaaaaa-0011-4000-8000-bbbbbbbbbb11', name: 'Lucy B.',     level: 3 },
  { id: 'aaaaaaaa-0012-4000-8000-bbbbbbbbbb12', name: 'Aisha O.',    level: 2 },
  { id: 'aaaaaaaa-0013-4000-8000-bbbbbbbbbb13', name: 'Ben F.',      level: 1 },
  { id: 'aaaaaaaa-0014-4000-8000-bbbbbbbbbb14', name: 'Natalie C.',  level: 2 },
  { id: 'aaaaaaaa-0015-4000-8000-bbbbbbbbbb15', name: 'Connor W.',   level: 1 },
]

// ─── Phrase banks ─────────────────────────────────────────────────────────────

const VISIT_CONTEXTS: Record<string, string[]> = {
  restaurants: [
    'Came here for a birthday dinner',
    'Popped in for lunch on a weekday',
    'Visited for a date night',
    'Tried it for Sunday lunch',
    'Came with the whole family',
    'Went with a group of friends after work',
    'Stopped by after a walk in the area',
    'Celebrated our anniversary here',
    'First visit but definitely not the last',
  ],
  cafes: [
    'My new go-to for a morning coffee',
    'Discovered this place by accident',
    'Came for a catch-up with a friend',
    'Perfect spot for working from',
    'Stopped in on the way to the shops',
    'Been coming here every weekend',
    'Needed a quiet place to work',
  ],
  pubs: [
    'Came for a Sunday roast',
    'Stopped in after the match',
    'Had a few drinks here on Friday night',
    'Brought my parents for a catch-up',
    'Regular here for the past year',
    'First time visiting on a quiet Tuesday',
    'Came for quiz night',
    'Popped in on the way home',
  ],
  bars: [
    'Had pre-dinner drinks here',
    'Came for a friend\'s birthday',
    'Tried it on a Saturday night',
    'Came for the cocktail menu',
    'First time here and was impressed',
  ],
  nightlife: [
    'Had a great night here',
    'Went with a big group for a birthday',
    'First time visiting on a Friday',
    'Came for the DJ set',
  ],
  salons: [
    'Been coming here for my cuts for months',
    'Tried them for the first time last week',
    'Needed a last-minute appointment',
    'Came for a full restyle',
    'Regular client here',
  ],
  beauty: [
    'Booked in for a treatment',
    'Regular client here',
    'Tried them for the first time',
    'Came for a special occasion',
  ],
  gyms: [
    'Member here for about six months',
    'Just joined and already loving it',
    'Tried a day pass',
    'Been coming three times a week',
    'Just started my fitness journey here',
  ],
  fitness: [
    'Been coming to classes regularly',
    'Tried the intro session',
    'Member for a few months now',
  ],
  spas: [
    'Came for a birthday treat',
    'Booked a day package',
    'Brought my mum for Mother\'s Day',
    'Needed a proper pamper session',
    'First visit but won\'t be the last',
  ],
  hotels: [
    'Stayed here for a weekend break',
    'Stopped over on a work trip',
    'Booked last minute and was pleasantly surprised',
    'Came for a special anniversary stay',
  ],
  default: [
    'Visited for the first time',
    'Been here a few times now',
    'Came on a recommendation',
    'Decided to give it a try',
  ],
}

type SentimentKey = 'great' | 'good' | 'mixed' | 'poor' | 'terrible'

const RATING_TO_SENTIMENT: Record<number, SentimentKey> = {
  5: 'great', 4: 'good', 3: 'mixed', 2: 'poor', 1: 'terrible',
}

const PHRASES: Record<string, Record<SentimentKey, string[]>> = {
  restaurants: {
    great: [
      'Every single dish was cooked to perfection',
      'The food was absolutely outstanding from start to finish',
      'Portions are generous and everything is beautifully presented',
      'Best meal I\'ve had in this area by a long way',
      'The flavours were spot on and ingredients clearly fresh',
      'Service was warm and attentive without being overbearing',
      'The atmosphere was brilliant — lively but not too loud',
    ],
    good: [
      'Food was really enjoyable overall',
      'Solid cooking and good value for money',
      'Service was friendly and efficient',
      'Nice atmosphere, good for a casual meal out',
      'Most dishes were excellent, one or two slightly average',
    ],
    mixed: [
      'Hit and miss — some dishes were great, others ordinary',
      'Service was a bit slow but the food made up for it',
      'Decent enough but nothing that blew me away',
      'Portion sizes were a little on the small side',
      'Prices felt slightly steep for what you get',
    ],
    poor: [
      'Food arrived lukewarm and had clearly been sat for a while',
      'Service was inattentive and we had to chase everything',
      'Not a great experience unfortunately',
      'Overpriced for the quality on the plate',
    ],
    terrible: [
      'Genuinely one of the worst meals I\'ve had',
      'Sent the food back twice — both times came back wrong',
      'Staff seemed totally uninterested',
      'Would not recommend to anyone',
    ],
  },
  cafes: {
    great: [
      'Coffee is exceptional — one of the best flat whites in the area',
      'Everything on the menu is homemade and you can taste it',
      'Lovely relaxed vibe, perfect for working or catching up',
      'Staff always remember my order which is a nice touch',
      'Pastries are genuinely outstanding',
    ],
    good: [
      'Really good coffee and a nice selection of food',
      'Friendly staff and a comfortable space',
      'Reliable spot — consistent every time',
      'Good value for the quality',
    ],
    mixed: [
      'Coffee was good but the food was a bit average',
      'Gets very busy at peak times — hard to get a seat',
      'Nice place but prices have crept up lately',
      'Service can be slow when it\'s busy',
    ],
    poor: [
      'Coffee was overextracted and bitter',
      'Not very welcoming when we arrived',
      'Pretty average for the price',
    ],
    terrible: [
      'Cold coffee and stale food — avoid',
      'Unfriendly service and way overpriced',
    ],
  },
  pubs: {
    great: [
      'Proper community pub — everyone made us feel welcome',
      'Sunday roast was incredible, portions massive',
      'Great selection of real ales and the staff know their stuff',
      'Brilliant atmosphere, exactly what a local should be',
      'Beer garden is a real suntrap in summer',
      'Food is miles better than your average pub grub',
    ],
    good: [
      'Solid pub with a good range of drinks',
      'Friendly regulars and welcoming staff',
      'Food is above average for a pub',
      'Good spot for watching the game',
    ],
    mixed: [
      'Nice pub but can get very crowded at weekends',
      'Drinks are decent but food is a bit inconsistent',
      'Service was friendly but took a while',
      'Gets noisy — not ideal if you want a quiet drink',
    ],
    poor: [
      'Flat pints and disinterested staff',
      'Food was pretty poor, wouldn\'t order again',
      'Overpriced for what it is',
    ],
    terrible: [
      'Dirty glasses and rude staff — won\'t be back',
      'Awful experience from start to finish',
    ],
  },
  bars: {
    great: [
      'Cocktails are creative and absolutely delicious',
      'Really knowledgeable bartenders who take time to recommend',
      'Atmosphere is brilliant — the music is spot on',
      'One of the best bar menus I\'ve come across',
    ],
    good: [
      'Great cocktail list and friendly service',
      'Good vibe for a Friday night',
      'Reasonable prices for the quality of drinks',
    ],
    mixed: [
      'Drinks are good but it gets extremely busy',
      'Nice spot but queues at the bar are long',
      'Hit the mark on some drinks, not others',
    ],
    poor: [
      'Cocktails were weak and overpriced',
      'Staff seemed rushed and uninterested',
    ],
    terrible: [
      'Terrible drinks and painfully slow service',
    ],
  },
  nightlife: {
    great: [
      'Incredible night — the DJ was fantastic',
      'Best club night I\'ve been to in ages',
      'Great crowd and the sound system is top notch',
    ],
    good: [
      'Good night out, would come back',
      'Decent music and a lively crowd',
    ],
    mixed: [
      'Fun enough but got very rammed',
      'Music was hit and miss',
    ],
    poor: [
      'Overpriced drinks and average music',
    ],
    terrible: [
      'Awful night — rude door staff and terrible music',
    ],
  },
  salons: {
    great: [
      'Best haircut I\'ve had in years — listened to exactly what I wanted',
      'Incredibly skilled stylist who really knows their craft',
      'Brilliant colour work — held its tone for weeks',
      'Such a relaxing experience, great chat too',
    ],
    good: [
      'Really happy with the cut — clean and exactly what I asked for',
      'Friendly staff and a nice atmosphere',
      'Good value for the quality of work',
    ],
    mixed: [
      'Cut was fine but not quite what I asked for',
      'Good stylist but the wait was longer than expected',
    ],
    poor: [
      'Not happy with the result — had to correct it elsewhere',
      'Rushed and didn\'t really listen to what I wanted',
    ],
    terrible: [
      'Disaster of a cut — had to go somewhere else to fix it',
    ],
  },
  beauty: {
    great: [
      'Exceptional treatment — left feeling completely refreshed',
      'Incredibly skilled therapist who really knew what they were doing',
      'Attention to detail was outstanding',
    ],
    good: [
      'Really lovely treatment and a relaxing atmosphere',
      'Great results and friendly staff',
    ],
    mixed: [
      'Treatment was fine but felt a bit rushed',
      'Good but slightly overpriced',
    ],
    poor: [
      'Not worth the price unfortunately',
    ],
    terrible: [
      'Terrible experience — would not recommend',
    ],
  },
  gyms: {
    great: [
      'Equipment is always well-maintained and the space never feels overcrowded',
      'The instructors are brilliant — really supportive and knowledgeable',
      'Classes are fantastic — the best I\'ve tried anywhere',
      'Clean, well-equipped, and the staff are genuinely helpful',
    ],
    good: [
      'Really good gym for the price — solid equipment throughout',
      'Friendly staff and a welcoming atmosphere',
      'Classes are a great addition to the membership',
    ],
    mixed: [
      'Good equipment but it gets very busy in the evenings',
      'Some machines need updating but overall fine',
    ],
    poor: [
      'Equipment is often broken and takes ages to fix',
      'Gets unbearably busy and staff aren\'t very helpful',
    ],
    terrible: [
      'Outdated equipment and completely indifferent staff',
    ],
  },
  fitness: {
    great: [
      'Brilliant classes with really motivating instructors',
      'The best fitness studio I\'ve joined',
    ],
    good: [
      'Great classes and a good atmosphere',
      'Really value the small class sizes',
    ],
    mixed: [
      'Classes are decent but booking is a bit of a faff',
    ],
    poor: [
      'Inconsistent quality depending on who\'s teaching',
    ],
    terrible: [
      'Not what was advertised — very disappointed',
    ],
  },
  spas: {
    great: [
      'Absolutely heavenly experience from start to finish',
      'The therapist was exceptional — completely tailored the treatment',
      'Left feeling genuinely restored — worth every penny',
      'Beautiful facilities and the most relaxing atmosphere',
    ],
    good: [
      'Really lovely treatment and a great atmosphere',
      'Good facilities and friendly, professional staff',
    ],
    mixed: [
      'Nice treatment but the facilities are a little tired',
      'Good but felt slightly rushed at the end',
    ],
    poor: [
      'Not as luxurious as the price suggests',
    ],
    terrible: [
      'Completely underwhelming for the amount they charge',
    ],
  },
  hotels: {
    great: [
      'Room was immaculate and the bed was incredibly comfortable',
      'Staff went above and beyond to make the stay special',
      'Brilliant location and beautifully appointed rooms',
      'Breakfast was exceptional — huge spread and all excellent quality',
    ],
    good: [
      'Really comfortable stay and great value',
      'Clean, well-maintained rooms and helpful staff',
      'Good location and solid facilities',
    ],
    mixed: [
      'Room was fine but slightly showing its age',
      'Good stay overall but breakfast was a let-down',
    ],
    poor: [
      'Room wasn\'t ready on arrival and the response was poor',
      'Noisy location and thin walls — barely slept',
    ],
    terrible: [
      'Awful stay — dirty room and completely unresponsive staff',
    ],
  },
  default: {
    great: [
      'Absolutely brilliant — exceeded all expectations',
      'Really impressive from start to finish',
      'Couldn\'t fault it — everything was spot on',
    ],
    good: [
      'Really enjoyed it — would definitely recommend',
      'Good experience overall, solid value',
    ],
    mixed: [
      'Decent enough but room for improvement',
      'Some good aspects but not without its issues',
    ],
    poor: [
      'Disappointed unfortunately — expected better',
    ],
    terrible: [
      'Very poor experience overall',
    ],
  },
}

const CLOSERS: Record<SentimentKey, string[]> = {
  great: [
    'Will absolutely be back.', 'Already booked again.', 'Highly recommend.',
    'A proper gem.', 'Worth every penny.', 'Tell everyone you know.',
    'One of my favourites in the area.', 'Can\'t wait to go back.',
  ],
  good: [
    'Would definitely recommend.', 'Will be back.', 'Good spot.',
    'Worth a visit.', 'Solid choice.', 'Happy to return.',
  ],
  mixed: [
    'Might give it another go.', 'Could be better, could be worse.',
    'Worth trying but manage your expectations.', 'Maybe on a quieter day.',
    'Good enough for a casual visit.',
  ],
  poor: [
    'Probably won\'t rush back.', 'Hopefully just a one-off.',
    'Would try somewhere else first.', 'Needs some work.',
  ],
  terrible: [
    'Would not recommend.', 'Avoid.', 'Won\'t be returning.',
    'Save yourself the disappointment.',
  ],
}

// Rating weights: index = star rating 1-5
const WEIGHTS = [0, 5, 10, 18, 32, 35]

function pickRating(rng: () => number): number {
  const total = WEIGHTS.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let i = 1; i <= 5; i++) {
    r -= WEIGHTS[i]
    if (r <= 0) return i
  }
  return 4
}

function randomPastDate(rng: () => number): string {
  // Random date within the past 18 months, weighted towards more recent
  const daysAgo = Math.floor(Math.pow(rng(), 0.6) * 540)
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

function buildBody(
  category: string,
  sentiment: SentimentKey,
  b: Business,
  rng: () => number,
): string {
  const bank = PHRASES[category] ?? PHRASES.default
  const sentencePool = bank[sentiment] ?? PHRASES.default[sentiment]

  // Pick 1-3 sentences depending on how chatty this reviewer is
  const count = Math.floor(rng() * 2) + 1
  const sentences = pickN(sentencePool, Math.min(count, sentencePool.length), rng)

  // Occasionally weave in a specific detail from the business
  const details: string[] = []
  if (b.cuisine) details.push(`the ${b.cuisine.toLowerCase()}`)
  if (b.tags.length) details.push(b.tags[0].toLowerCase())
  if (b.neighbourhood && rng() > 0.7) details.push(`in ${b.neighbourhood}`)

  let body = sentences.join('. ')
  if (body && !body.endsWith('.')) body += '.'

  // Occasionally mention the business name
  if (rng() > 0.65) {
    body = `${b.name} ${rng() > 0.5 ? 'really' : 'genuinely'} ${rng() > 0.5 ? 'impressed' : 'delivered'}. ${body}`
  }

  return body
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface SeedReview {
  business_id:  string
  author_id:    string
  author_name:  string
  author_level: number
  rating:       number
  food:         number | null
  service:      number | null
  ambience:     number | null
  value:        number | null
  title:        string | null
  body:         string
  visit_type:   string | null
  created_at:   string
}

export function generateReviews(b: Business): SeedReview[] {
  const rng = makePrng(strSeed(b.id + b.name))

  const count = 2 + Math.floor(rng() * 5) // 2–6 reviews

  const category = b.category as string
  const contexts = VISIT_CONTEXTS[category] ?? VISIT_CONTEXTS.default

  // Pick `count` distinct personas
  const personas = pickN(PERSONAS, Math.min(count, PERSONAS.length), rng)
  const isFood = ['restaurants', 'cafes', 'pubs', 'bars'].includes(category)

  return personas.map((persona, i) => {
    // Each reviewer gets their own sub-seed so ratings/text are independent
    const reviewRng = makePrng(strSeed(b.id + persona.id + String(i)))

    const rating    = pickRating(reviewRng)
    const sentiment = RATING_TO_SENTIMENT[rating]
    const context   = pick(contexts, reviewRng)
    const closer    = pick(CLOSERS[sentiment], reviewRng)
    const body      = `${context}. ${buildBody(category, sentiment, b, reviewRng)} ${closer}`

    // Sub-scores only make sense for food venues
    const sub = isFood ? Math.max(1, Math.min(5, rating + Math.round((reviewRng() - 0.5) * 2))) : null

    return {
      business_id:  b.id,
      author_id:    persona.id,
      author_name:  persona.name,
      author_level: persona.level,
      rating,
      food:         isFood ? sub : null,
      service:      sub,
      ambience:     isFood ? Math.max(1, Math.min(5, rating + Math.round((reviewRng() - 0.5) * 2))) : null,
      value:        Math.max(1, Math.min(5, rating + Math.round((reviewRng() - 0.5) * 2))),
      title:        null,
      body:         body.trim(),
      visit_type:   null,
      created_at:   randomPastDate(reviewRng),
    }
  })
}
