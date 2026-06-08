import { NavLink } from 'react-router-dom'
import { Compass, Map, Newspaper, Search, Tag, User } from 'lucide-react'
import clsx from 'clsx'

const tabs = [
  { to: '/', label: 'Discover', icon: Compass, end: true },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/deals', label: 'Deals', icon: Tag },
  { to: '/feed', label: 'Feed', icon: Newspaper },
  { to: '/me', label: 'Me', icon: User },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition',
                isActive ? 'text-brand-600' : 'text-stone-500',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
