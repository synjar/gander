import { Link } from 'react-router-dom'
import { categories } from '../data/categories'
import { APP } from '../data'

const columns = [
  {
    heading: 'Discover',
    links: [
      { label: 'Gander Picks', to: '/' },
      { label: 'Must-Eat List', to: '/?rank=1' },
      { label: 'Deals & vouchers', to: '/deals' },
      { label: 'Community feed', to: '/feed' },
    ],
  },
  {
    heading: 'For businesses',
    links: [
      { label: 'Claim your listing', to: '/business' },
      { label: 'Advertise on Gander', to: '/business' },
      { label: 'Business login', to: '/business/dashboard' },
      { label: 'Success stories', to: '/business' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About us', to: '/' },
      { label: 'Careers', to: '/' },
      { label: 'Press', to: '/' },
      { label: 'Admin console', to: '/admin' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-stone-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 font-display text-xl font-semibold text-white">
              {APP.name[0]}
            </span>
            <span className="font-display text-2xl font-semibold text-stone-900">{APP.name}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-stone-500">
            Discover, review and book the best restaurants, cafés, bars and local
            spots across England.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                to={`/search?category=${c.id}`}
                className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 hover:bg-stone-200"
              >
                {c.emoji} {c.label}
              </Link>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.heading}>
            <h4 className="text-sm font-semibold text-stone-900">{col.heading}</h4>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-stone-500 hover:text-brand-600">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-stone-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-stone-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {APP.name}. A prototype — sample data only.</p>
          <p className="flex gap-4">
            <span className="hover:text-stone-600">Privacy</span>
            <span className="hover:text-stone-600">Terms</span>
            <span className="hover:text-stone-600">Cookies</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
