/**
 * DirectionsButton
 *
 * Shows a small popover letting the user choose between Google Maps,
 * Apple Maps and Waze. On iOS the order is flipped so Apple Maps appears first.
 */
import { useRef, useState, useEffect } from 'react'
import { Navigation } from 'lucide-react'

interface Props {
  lat: number
  lng: number
  name: string
  /** 'icon' = small round icon button (action bar); 'full' = text+icon pill */
  variant?: 'icon' | 'full'
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iP(hone|od|ad)/.test(navigator.userAgent)
}

interface MapOption {
  label: string
  icon: string // emoji
  url: (lat: number, lng: number, name: string) => string
}

const GOOGLE: MapOption = {
  label: 'Google Maps',
  icon: '🗺️',
  url: (lat, lng, name) =>
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_name=${encodeURIComponent(name)}`,
}

const APPLE: MapOption = {
  label: 'Apple Maps',
  icon: '🍎',
  url: (lat, lng) => `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`,
}

const WAZE: MapOption = {
  label: 'Waze',
  icon: '🚗',
  url: (lat, lng) => `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
}

export default function DirectionsButton({ lat, lng, name, variant = 'icon' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const options = isIOS() ? [APPLE, GOOGLE, WAZE] : [GOOGLE, APPLE, WAZE]

  const trigger =
    variant === 'icon' ? (
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Get directions"
        className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50"
      >
        <Navigation size={18} />
      </button>
    ) : (
      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full border border-stone-200 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
      >
        <Navigation size={15} /> Get directions
      </button>
    )

  return (
    <div ref={ref} className="relative">
      {trigger}

      {open && (
        <div
          className={`absolute z-50 mt-2 w-44 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg ${
            variant === 'icon' ? 'right-0' : 'left-1/2 -translate-x-1/2'
          }`}
        >
          {options.map((opt) => (
            <a
              key={opt.label}
              href={opt.url(lat, lng, name)}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 transition hover:bg-stone-50"
            >
              <span className="text-base leading-none">{opt.icon}</span>
              {opt.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
