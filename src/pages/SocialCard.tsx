import { useSearchParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { BarChart3, CalendarCheck, Camera, Sparkles } from 'lucide-react'
import { APP } from '../data'

/**
 * A 1080×1080 social-media card (Facebook/Instagram) selling the business
 * pitch — the square cousin of the printable flyer. Open /business/social,
 * screenshot the square, attach to the post. Add ?town=Worthing to localise.
 */
export default function SocialCard() {
  const [params] = useSearchParams()
  const town = params.get('town')?.trim() || 'your town'

  const origin =
    (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://gander.social')
  const claimUrl = `${origin}/business`
  const prettyUrl = claimUrl.replace(/^https?:\/\//, '')

  return (
    <div className="px-4 py-8">
      <div className="mx-auto mb-5 max-w-2xl text-center">
        <h1 className="font-display text-xl font-semibold text-stone-900">Social post graphic</h1>
        <p className="text-sm text-stone-500">
          Screenshot the square below (Win + Shift + S) and attach it to your Facebook post.
          Add <code className="rounded bg-stone-100 px-1">?town=Worthing</code> to the URL to localise it.
        </p>
      </div>

      {/* The 1080×1080 card */}
      <div
        className="relative mx-auto flex flex-col overflow-hidden bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800 text-white"
        style={{ width: 1080, height: 1080 }}
      >
        {/* Brand glow */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl" />

        <div className="relative flex flex-1 flex-col px-20 py-12">
          {/* Logo row */}
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-500 font-display text-4xl font-semibold">
              {APP.name[0]}
            </span>
            <span className="font-display text-4xl font-semibold tracking-tight">{APP.name}</span>
            <span className="ml-auto rounded-full bg-white/10 px-5 py-2 text-xl font-semibold capitalize">
              📍 {town}
            </span>
          </div>

          {/* Headline */}
          <h2 className="mt-10 font-display text-7xl font-semibold leading-[1.05]">
            Your business is <span className="text-brand-400">already on here.</span>
          </h2>
          <p className="mt-4 max-w-3xl text-3xl leading-snug text-stone-300">
            Gander helps locals find the best independent spots{town !== 'your town' ? ` in ${town}` : ''}.
            Claim your free listing in 2 minutes.
          </p>

          {/* Bullets */}
          <div className="mt-8 space-y-4 text-3xl">
            {[
              { icon: Camera, text: 'Your photos, menu, hours & deals' },
              { icon: CalendarCheck, text: 'Take bookings — zero commission' },
              { icon: BarChart3, text: 'See your views, searches & review insights' },
            ].map(({ icon: Icon, text }) => (
              <p key={text} className="flex items-center gap-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-500/20 text-brand-400">
                  <Icon size={28} />
                </span>
                {text}
              </p>
            ))}
          </div>

          {/* Pricing pill */}
          <div className="mt-8 inline-flex w-fit items-center gap-3 rounded-full bg-emerald-400/15 px-8 py-4 text-3xl font-semibold text-emerald-300 ring-1 ring-emerald-400/40">
            <Sparkles size={30} /> Free to list · first 5 months commission-free
          </div>

          {/* Footer: URL + QR */}
          <div className="mt-auto flex items-end justify-between pt-8">
            <div>
              <p className="text-2xl text-stone-400">Claim your free listing</p>
              <p className="mt-1 font-display text-4xl font-semibold text-brand-400">{prettyUrl}</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <QRCodeCanvas value={claimUrl} size={150} level="M" includeMargin={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
