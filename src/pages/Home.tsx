import { useState, useMemo, useCallback, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Building2, Landmark, Search, Sparkles, Star, TrendingUp, Trophy } from 'lucide-react'
import clsx from 'clsx'
import type { Business } from '../data/types'
import { businesses, businessesById } from '../data/businesses'
import { categories } from '../data/categories'
import { seedFeed } from '../data/feed'
import { useCity } from '../city/CityContext'
import { useStore } from '../store/StoreContext'
import * as db from '../lib/db'
import { Section, Carousel } from '../components/Section'
import BusinessCard from '../components/BusinessCard'
import DealCard from '../components/DealCard'
import Avatar from '../components/Avatar'
import SmartImage from '../components/SmartImage'

const popular = [
  'Sunday roast',
  'Bottomless brunch',
  'Cocktail bars',
  'Date night',
  'Dog friendly',
  'Seafood',
]

const categoryTints: Record<string, string> = {
  restaurants:  'bg-orange-50 ring-orange-100',
  cafes:        'bg-amber-50 ring-amber-100',
  bars:         'bg-rose-50 ring-rose-100',
  salons:       'bg-violet-50 ring-violet-100',
  gyms:         'bg-sky-50 ring-sky-100',
  spas:         'bg-emerald-50 ring-emerald-100',
  hotels:       'bg-indigo-50 ring-indigo-100',
  attractions:  'bg-teal-50 ring-teal-100',
}

function CitySelect({ className }: { className?: string }) {
  const { city, setCity, cities } = useCity()
  return (
    <select
      value={city.id}
      onChange={(e) => setCity(e.target.value)}
      aria-label="Choose a city"
      className={clsx(
        'cursor-pointer rounded-lg bg-white/80 px-2 py-0.5 font-semibold text-brand-600 ring-1 ring-brand-100 outline-none',
        className,
      )}
    >
      {cities.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  )
}

function Hero() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  function submit(e: FormEvent) {
    e.preventDefault()
    navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }
  return (
    <section className="relative overflow-hidden border-b border-stone-200 bg-gradient-to-b from-brand-50 via-orange-50/40 to-stone-50">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-4 py-14 text-center sm:py-20">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-100">
          <Sparkles size={13} /> England’s local discovery app
        </span>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-stone-900 sm:text-6xl">
          Find the best of your <span className="text-brand-600">high street</span>
        </h1>
        <p className="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-base text-stone-600 sm:text-lg">
          <span>Reviews you can trust and deals worth booking — right now in</span>
          <CitySelect />
        </p>

        <form
          onSubmit={submit}
          className="mx-auto mt-7 flex max-w-xl items-center rounded-full border border-stone-200 bg-white p-1.5 shadow-lg shadow-brand-500/5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100"
        >
          <Search size={20} className="ml-3 shrink-0 text-stone-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try “sushi”, “Sunday roast” or “dog-friendly pub”"
            className="min-w-0 flex-1 bg-transparent px-3 text-sm text-stone-800 outline-none placeholder:text-stone-400 sm:text-base"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Search
          </button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {popular.map((p) => (
            <Link
              key={p}
              to={`/search?q=${encodeURIComponent(p)}`}
              className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-stone-600 ring-1 ring-stone-200 transition hover:bg-white hover:text-brand-600"
            >
              {p}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function CategoryTiles({ visibleCategories }: { visibleCategories: typeof categories }) {
  if (visibleCategories.length === 0) return null
  return (
    <section className="mx-auto max-w-7xl py-6">
      {/* Single scrollable row — swipeable on mobile, scroll on desktop */}
      <div className="relative">
        <div className="flex gap-2.5 overflow-x-auto px-4 pb-2 no-scrollbar sm:gap-3">
          {visibleCategories.map((c) => (
            <Link
              key={c.id}
              to={`/search?category=${c.id}`}
              className={clsx(
                'flex w-[4.5rem] shrink-0 flex-col items-center gap-2 rounded-2xl px-1.5 py-4 text-center ring-1 transition hover:-translate-y-0.5 hover:shadow-md sm:w-20 md:w-24',
                categoryTints[c.id] ?? 'bg-stone-50 ring-stone-100',
              )}
            >
              <span className="text-2xl sm:text-3xl">{c.emoji}</span>
              <span className="text-[10px] font-semibold leading-tight text-stone-700 sm:text-xs">{c.label}</span>
            </Link>
          ))}
        </div>
        {/* Fade hint — signals there are more tiles off-screen to the right */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" aria-hidden />
      </div>
    </section>
  )
}

function CommunityStrip() {
  const { city } = useCity()
  const cityPosts = seedFeed.filter((p) => businessesById[p.businessId]?.cityId === city.id)
  const posts = (cityPosts.length ? cityPosts : seedFeed).slice(0, 3)
  return (
    <Section
      title="From the community"
      subtitle="What Gander reviewers are loving right now"
      seeAllTo="/feed"
      seeAllLabel="Open feed"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            to={`/b/${businessesById[post.businessId]?.slug ?? ''}`}
            className="group flex flex-col overflow-hidden rounded-2xl bg-white card-shadow ring-1 ring-stone-100 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="aspect-[16/9] overflow-hidden">
              <SmartImage
                src={post.photos[0]}
                seedFallback={post.id}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2">
                <Avatar name={post.userName} src={post.userAvatar} size={28} />
                <span className="text-sm font-medium text-stone-700">{post.userName}</span>
                <span className="text-xs text-stone-400">· {post.time}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-stone-600">{post.text}</p>
              <p className="mt-2 text-xs font-semibold text-brand-600">
                {post.businessName} · {post.neighbourhood}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  )
}

export default function Home() {
  const { city } = useCity()
  const { hiddenBusinesses, liveBusinesses, importedBusinesses, profileHeroImages, allDeals } = useStore()
  const isLondon = city.id === 'london'

  // Apply merchant hero-image overrides so cards reflect the uploaded thumbnail
  const applyHero = useCallback(
    (b: Business) =>
      profileHeroImages.has(b.id) ? { ...b, heroImage: profileHeroImages.get(b.id)! } : b,
    [profileHeroImages],
  )

  // Curated = hand-seeded + approved submissions (not OSM stubs)
  const curatedBiz = useMemo(
    () => [...businesses, ...liveBusinesses].filter(
      (b) => b.cityId === city.id && !hiddenBusinesses.includes(b.id),
    ).map(applyHero),
    [liveBusinesses, hiddenBusinesses, city.id, applyHero],
  )
  // OSM venue stubs (non-attractions) shown in "More in city" section
  const osmCityBiz = useMemo(
    () => importedBusinesses.filter(
      (b) => b.cityId === city.id && !hiddenBusinesses.includes(b.id) && b.category !== 'attractions',
    ).map(applyHero),
    [importedBusinesses, hiddenBusinesses, city.id, applyHero],
  )
  // Attractions shown in their own dedicated section
  const osmCityAttractions = useMemo(
    () => importedBusinesses.filter(
      (b) => b.cityId === city.id && !hiddenBusinesses.includes(b.id) && b.category === 'attractions',
    ).map(applyHero),
    [importedBusinesses, hiddenBusinesses, city.id, applyHero],
  )
  const allBiz = useMemo(
    () => [...businesses, ...liveBusinesses, ...importedBusinesses].map(applyHero),
    [liveBusinesses, importedBusinesses, applyHero],
  )
  const cityBiz = useMemo(
    () => allBiz.filter((b) => b.cityId === city.id && !hiddenBusinesses.includes(b.id)),
    [allBiz, city.id, hiddenBusinesses],
  )
  // Only show category tiles that have at least one venue in the current city
  const populatedCategories = useMemo(() => {
    const withVenues = new Set(cityBiz.map((b) => b.category))
    return categories.filter((c) => withVenues.has(c.id))
  }, [cityBiz])
  const topRated = [...curatedBiz].sort((a, b) => b.rating - a.rating)

  const featuredRaw = curatedBiz.filter((b) => b.featured)
  const picks = featuredRaw.length >= 3 ? featuredRaw : topRated.slice(0, 6)

  const ranked = curatedBiz.filter((b) => b.rank).sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
  const mustEat = ranked.length ? ranked : topRated.slice(0, 8)
  // Merchant-created deals (from the store) + seed deals, scoped to this city.
  // Resolve the venue across seed/live/imported so deals on claimed venues show.
  const cityDeals = useMemo(() => {
    const cityBizIds = new Set(allBiz.filter((b) => b.cityId === city.id).map((b) => b.id))
    return allDeals.filter((d) => cityBizIds.has(d.businessId))
  }, [allDeals, allBiz, city.id])

  // Trending: load from Supabase (real recent reviews), fall back to top-rated mix
  const [trendingIds, setTrendingIds] = useState<string[]>([])
  useEffect(() => {
    db.getTrendingBusinessIds(8).then(setTrendingIds)
  }, [])

  const trending = useMemo(() => {
    if (trendingIds.length > 0) {
      const fromBackend = trendingIds
        .map((id) => cityBiz.find((b) => b.id === id))
        .filter(Boolean) as typeof cityBiz
      // Pad with top-rated if backend didn't return enough for this city
      const ids = new Set(fromBackend.map((b) => b.id))
      const fallback = topRated.filter((b) => !ids.has(b.id))
      return [...fromBackend, ...fallback].slice(0, 8)
    }
    // No backend data: mix of high-review-count and high-rated for variety
    return [...cityBiz]
      .sort((a, b) => (b.reviewCount * 0.6 + b.rating * 40) - (a.reviewCount * 0.6 + a.rating * 40))
      .slice(0, 8)
  }, [trendingIds, cityBiz, topRated])

  return (
    <>
      <Helmet>
        <title>Gander — Discover {city.name}'s best restaurants, bars &amp; more</title>
        <meta name="description" content={`Discover the best restaurants, cafés, bars and hidden gems in ${city.name}. Real reviews from real locals.`} />
        <meta property="og:title" content={`Gander — ${city.name}'s best places`} />
        <meta property="og:description" content={`Discover the best restaurants, cafés, bars and hidden gems in ${city.name}.`} />
      </Helmet>
      <Hero />
      <CategoryTiles visibleCategories={populatedCategories} />

      <Section
        title="Gander Picks"
        subtitle={`Hand-picked favourites across ${city.name}`}
        seeAllTo="/search"
      >
        <Carousel>
          {picks.map((b) => (
            <BusinessCard key={b.id} business={b} showRank className="w-64 shrink-0 snap-start sm:w-72" />
          ))}
        </Carousel>
      </Section>

      <div className="bg-white">
        <Section
          title={isLondon ? 'The Must-Eat List 2026' : `The best of ${city.name}`}
          subtitle={isLondon ? 'London’s essential tables, ranked by Gander' : 'Top-rated spots locals rave about'}
          seeAllTo="/search?category=restaurants"
        >
          <div className="mb-4 flex items-center gap-2 text-sm text-amber-700">
            <Trophy size={16} className="text-amber-500" />
            {isLondon
              ? 'Our annual roundup of the restaurants worth crossing town for'
              : `The highest-rated places to eat, drink and unwind in ${city.name}`}
          </div>
          <Carousel>
            {mustEat.map((b) => (
              <BusinessCard key={b.id} business={b} showRank className="w-64 shrink-0 snap-start sm:w-72" />
            ))}
          </Carousel>
        </Section>
      </div>

      <Section title="Trending near you" subtitle={`Buzzing in ${city.name} this week`} seeAllTo="/search">
        <div className="mb-4 flex items-center gap-2 text-sm text-stone-500">
          <TrendingUp size={16} className="text-brand-500" />
          Based on recent reviews and bookings
        </div>
        <Carousel>
          {trending.map((b) => (
            <BusinessCard key={b.id} business={b} className="w-64 shrink-0 snap-start sm:w-72" />
          ))}
        </Carousel>
      </Section>

      {cityDeals.length > 0 && (
        <div className="bg-gradient-to-b from-emerald-50/60 to-stone-50">
          <Section title="Deals & vouchers" subtitle={`Save in ${city.name}`} seeAllTo="/deals">
            <Carousel>
              {cityDeals.map((d) => (
                <DealCard key={d.id} deal={d} className="w-72 shrink-0 snap-start" />
              ))}
            </Carousel>
          </Section>
        </div>
      )}

      <Section title="Explore by neighbourhood" subtitle={`${city.name}, one high street at a time`}>
        <div className="flex flex-wrap gap-2.5">
          {city.neighbourhoods.map((n) => (
            <Link
              key={n}
              to={`/search?neighbourhood=${encodeURIComponent(n)}`}
              className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-brand-50 hover:text-brand-600 hover:ring-brand-200"
            >
              <Star size={13} className="text-brand-400" />
              {n}
            </Link>
          ))}
        </div>
      </Section>

      {osmCityAttractions.length > 0 && (
        <div className="bg-teal-50/40 border-t border-teal-100/60">
          <Section
            title={`Places to visit in ${city.name}`}
            subtitle="Parks, piers, museums and local landmarks"
            seeAllTo="/search?category=attractions"
            seeAllLabel="See all attractions"
          >
            <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-teal-200 bg-white px-4 py-3 text-sm text-stone-500">
              <Landmark size={16} className="mt-0.5 shrink-0 text-teal-500" />
              <span>
                Public attractions, parks and heritage sites — council-owned or publicly managed.
                Not affiliated with any business on Gander.
              </span>
            </div>
            <Carousel>
              {osmCityAttractions.slice(0, 16).map((b) => (
                <BusinessCard key={b.id} business={b} className="w-56 shrink-0 snap-start sm:w-64" />
              ))}
            </Carousel>
          </Section>
        </div>
      )}

      {osmCityBiz.length > 0 && (
        <div className="bg-stone-50/80 border-t border-stone-100">
          <Section
            title={`More in ${city.name}`}
            subtitle="Community listings — unverified places sourced from OpenStreetMap"
            seeAllTo={`/search?source=osm`}
          >
            <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-500">
              <Building2 size={16} className="mt-0.5 shrink-0 text-stone-400" />
              <span>
                These are basic listings imported from OpenStreetMap — they haven't been verified by Gander.{' '}
                <Link to="/merchant" className="font-medium text-brand-600 hover:underline">
                  Own one? Claim your listing →
                </Link>
              </span>
            </div>
            <Carousel>
              {osmCityBiz.slice(0, 16).map((b) => (
                <BusinessCard key={b.id} business={b} className="w-56 shrink-0 snap-start sm:w-64" />
              ))}
            </Carousel>
          </Section>
        </div>
      )}

      <CommunityStrip />
    </>
  )
}
