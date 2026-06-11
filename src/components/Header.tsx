import { useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ChevronDown, MapPin, PenLine, Search } from 'lucide-react'
import clsx from 'clsx'
import Avatar from './Avatar'
import NotificationBell from './NotificationBell'
import { useAuth } from '../auth/AuthContext'
import AuthModal from './AuthModal'
import { APP } from '../data'
import { useCity } from '../city/CityContext'

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 font-display text-xl font-semibold text-white shadow-sm">
        {APP.name[0]}
      </span>
      <span className="hidden font-display text-2xl font-semibold tracking-tight text-stone-900 sm:block">
        {APP.name}
      </span>
    </Link>
  )
}

function SearchBar({ compact }: { compact?: boolean }) {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const { city, setCity, cities } = useCity()

  function submit(e: FormEvent) {
    e.preventDefault()
    navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <form
      onSubmit={submit}
      className={clsx(
        'flex items-center rounded-full border border-stone-200 bg-stone-50 pl-4 pr-1.5 py-1.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100',
        compact ? 'w-full' : 'w-full max-w-xl',
      )}
    >
      <Search size={18} className="shrink-0 text-stone-400" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Restaurants, cafés, things to do…"
        className="min-w-0 flex-1 bg-transparent px-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-400"
      />
      <span className="mx-1 hidden h-5 w-px bg-stone-200 sm:block" />
      <span className="hidden items-center gap-1 pr-1 text-sm text-stone-500 sm:flex">
        <MapPin size={15} className="text-brand-500" />
        <select
          value={city.id}
          onChange={(e) => setCity(e.target.value)}
          aria-label="Choose a city"
          className="max-w-[8rem] cursor-pointer bg-transparent pr-1 font-medium text-stone-700 outline-none"
        >
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </span>
      <button
        type="submit"
        className="rounded-full bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-600"
      >
        Search
      </button>
    </form>
  )
}

const navItems = [
  { to: '/', label: 'Discover', end: true },
  { to: '/map', label: 'Map' },
  { to: '/deals', label: 'Deals' },
  { to: '/feed', label: 'Feed' },
]

export default function Header() {
  const { user, configured } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-5">
        <Logo />

        <div className="hidden flex-1 md:block">
          <SearchBar />
        </div>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'rounded-full px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'text-brand-600'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Link
          to="/search"
          className="hidden items-center gap-1.5 rounded-full border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 lg:flex"
        >
          <PenLine size={16} className="text-brand-500" />
          Write a review
        </Link>

        {configured && user.isGuest && (
          <button
            onClick={() => setAuthOpen(true)}
            className="ml-auto rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 md:ml-0"
          >
            Sign in
          </button>
        )}
        <NotificationBell />
        <Link
          to="/me"
          className={clsx(
            'flex items-center gap-1 md:ml-0',
            !(configured && user.isGuest) && 'ml-auto',
          )}
        >
          <Avatar name={user.name} src={user.avatar} size={36} />
          <ChevronDown size={16} className="hidden text-stone-400 sm:block" />
        </Link>
      </div>

      {/* Mobile search row */}
      <div className="px-4 pb-3 md:hidden">
        <SearchBar compact />
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  )
}
