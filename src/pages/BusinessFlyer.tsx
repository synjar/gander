import { useSearchParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { Mail, Phone, Printer, Sparkles } from 'lucide-react'
import { APP } from '../data'

// Founder contact shown on the printed flyer so venues can reach you directly.
const CONTACT = {
  name: 'Jordan',
  email: 'jordanhummel10@gmail.com',
  phone: '+44 7749 358560',
}

/**
 * A print-ready leave-behind card for in-person merchant outreach. Open
 * /business/flyer, hit Print, and hand the card to a venue — the QR takes them
 * straight to the claim page. Add ?town=Worthing to localise the headline.
 *
 * Print CSS (scoped to this page's lifecycle) hides the app chrome so only the
 * card prints.
 */
export default function BusinessFlyer() {
  const [params] = useSearchParams()
  const town = params.get('town')?.trim()

  const origin =
    (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://gander.social')
  const claimUrl = `${origin}/business`

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Print styles — only active while this page is mounted */}
      <style>{`@media print {
        header, footer, nav.fixed, .no-print { display: none !important; }
        body { background: #fff !important; }
        main { padding: 0 !important; }
        .flyer-card { box-shadow: none !important; border: 1px solid #e7e5e4 !important; margin: 0 auto !important; }
        @page { size: A5 portrait; margin: 12mm; }
      }`}</style>

      <div className="no-print mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-stone-900">Outreach flyer</h1>
          <p className="text-sm text-stone-500">Print and hand to a venue, or leave on the counter. The QR opens the claim page.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <Printer size={16} /> Print
        </button>
      </div>

      {/* The card */}
      <div className="flyer-card mx-auto max-w-md overflow-hidden rounded-3xl bg-white text-center shadow-lg ring-1 ring-stone-200">
        <div className="bg-gradient-to-br from-stone-900 to-stone-800 px-8 pb-7 pt-8 text-white">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-500 font-display text-2xl font-semibold text-white">
            {APP.name[0]}
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold leading-tight">
            Your business is already on {APP.name}
          </h2>
          <p className="mt-2 text-sm text-stone-300">
            {town
              ? `Join the best of ${town} — claim your free listing in 2 minutes.`
              : 'Claim your free listing in 2 minutes and get discovered by locals.'}
          </p>
        </div>

        <div className="px-8 py-7">
          <div className="mx-auto inline-block rounded-2xl border border-stone-200 p-3">
            <QRCodeCanvas value={claimUrl} size={188} level="M" includeMargin={false} />
          </div>
          <p className="mt-3 text-sm font-semibold text-stone-900">Scan to claim your listing</p>
          <p className="mt-0.5 font-mono text-xs text-stone-400">{claimUrl.replace(/^https?:\/\//, '')}</p>

          <div className="mt-5 space-y-2 text-left text-sm text-stone-600">
            {['Free listing — photos, hours, menu & deals', 'Real analytics: views, searches & review insights', 'We only earn when we sell for you'].map((t) => (
              <p key={t} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                {t}
              </p>
            ))}
          </div>

          <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <Sparkles size={13} /> Free for your first 5 months, then just 5%
          </div>

          <div className="mt-5 border-t border-stone-100 pt-4 text-center text-sm">
            <p className="font-semibold text-stone-900">Questions? Talk to {CONTACT.name}</p>
            <p className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-stone-600">
              <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-1 hover:text-brand-600">
                <Mail size={13} /> {CONTACT.email}
              </a>
              <span className="text-stone-300">·</span>
              <a href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`} className="flex items-center gap-1 hover:text-brand-600">
                <Phone size={13} /> {CONTACT.phone}
              </a>
            </p>
          </div>
        </div>
      </div>

      <p className="no-print mt-4 text-center text-xs text-stone-400">
        Tip: add <code className="rounded bg-stone-100 px-1">?town=Worthing</code> to the URL to localise the headline.
      </p>
    </div>
  )
}
