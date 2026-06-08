import { useMemo, useState } from 'react'
import { Tag } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import clsx from 'clsx'
import { useStore } from '../store/StoreContext'
import { businessesById } from '../data/businesses'
import { categories } from '../data/categories'
import { discountPct } from '../lib/format'
import { useCity } from '../city/CityContext'
import DealCard from '../components/DealCard'

type Sort = 'popular' | 'discount' | 'price'

export default function Deals() {
  const { allDeals } = useStore()
  const { city } = useCity()
  const [cat, setCat] = useState<string>('all')
  const [sort, setSort] = useState<Sort>('popular')

  const list = useMemo(() => {
    let l = allDeals.filter((d) => {
      const biz = businessesById[d.businessId]
      if (!biz || biz.cityId !== city.id) return false
      if (cat === 'all') return true
      return biz.category === cat
    })
    if (sort === 'discount')
      l = [...l].sort(
        (a, b) => discountPct(b.originalPrice, b.dealPrice) - discountPct(a.originalPrice, a.dealPrice),
      )
    else if (sort === 'price') l = [...l].sort((a, b) => a.dealPrice - b.dealPrice)
    else l = [...l].sort((a, b) => b.sold - a.sold)
    return l
  }, [cat, sort, allDeals, city])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Helmet>
        <title>Deals &amp; Vouchers in {city.name} | Gander</title>
        <meta name="description" content={`Save money on the best restaurants, bars and activities in ${city.name} with exclusive Gander deals and vouchers.`} />
      </Helmet>
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-orange-600 px-6 py-10 text-white sm:px-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          <Tag size={13} /> Limited-time offers
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Deals & vouchers</h1>
        <p className="mt-2 max-w-lg text-white/90">
          Prepaid set menus, spa days, classes and more — buy a voucher and redeem it at the venue.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
          <button
            onClick={() => setCat('all')}
            className={clsx(
              'shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition',
              cat === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50',
            )}
          >
            All deals
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={clsx(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition',
                cat === c.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50',
              )}
            >
              <span>{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="shrink-0 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 outline-none focus:border-brand-400"
        >
          <option value="popular">Most popular</option>
          <option value="discount">Biggest discount</option>
          <option value="price">Lowest price</option>
        </select>
      </div>

      {list.length === 0 ? (
        <p className="py-20 text-center text-stone-500">No deals in this category right now.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((d) => (
            <DealCard key={d.id} deal={d} />
          ))}
        </div>
      )}
    </div>
  )
}
