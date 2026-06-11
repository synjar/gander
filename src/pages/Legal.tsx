import { Link } from 'react-router-dom'
import { APP } from '../data'

/**
 * Lightweight legal pages (/terms and /privacy). Plain-English summaries that
 * give the onboarding form, cold-outreach footer and site footer something
 * real to link to. One component, two routes.
 */

const CONTACT_EMAIL = 'jordanhummel10@gmail.com'

function LegalShell({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-stone-900">{title}</h1>
      <p className="mt-1 text-sm text-stone-400">Last updated {updated}</p>
      <div className="prose-sm mt-6 space-y-5 leading-relaxed text-stone-600 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-stone-900">
        {children}
      </div>
      <p className="mt-10 rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-500">
        Questions? Email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-brand-600 hover:underline">
          {CONTACT_EMAIL}
        </a>
        {' '}— we read everything.
      </p>
    </div>
  )
}

export function Terms() {
  return (
    <LegalShell title="Terms of Service" updated="June 2026">
      <section>
        <h2>1. What {APP.name} is</h2>
        <p>
          {APP.name} is a local discovery platform for England: people use it to find, review and
          book independent venues, and businesses use it to manage their listing, run deals and
          take bookings. By using {APP.name} you agree to these terms.
        </p>
      </section>
      <section>
        <h2>2. Your account</h2>
        <p>
          Keep your login details safe — you're responsible for activity on your account. You must
          be 16 or older. We may suspend accounts that abuse the platform, post fake reviews or
          make fraudulent listing claims.
        </p>
      </section>
      <section>
        <h2>3. Reviews and content</h2>
        <p>
          Reviews must reflect a genuine experience. Don't post anything unlawful, defamatory or
          spammy. You keep ownership of what you post but grant us a licence to display it on the
          platform. We may remove content that breaks these rules.
        </p>
      </section>
      <section>
        <h2>4. Business listings</h2>
        <p>
          Basic listings are compiled from public sources (such as OpenStreetMap) so locals can
          find venues. Owners can claim their listing for free to manage it. Only claim a listing
          if you're the owner or an authorised representative — fraudulent claims are removed.
        </p>
      </section>
      <section>
        <h2>5. Deals, vouchers and payments</h2>
        <p>
          Voucher payments are processed securely by Stripe — we never see or store your card
          details. Vouchers are redeemable at the named venue, subject to the deal's stated terms
          and expiry. The venue is responsible for honouring valid vouchers; if a venue can't
          honour your voucher, contact us and we'll put it right. Merchant pricing: listing is
          free, the first 5 months are commission-free, then 5% per voucher sold. Bookings carry
          no commission.
        </p>
      </section>
      <section>
        <h2>6. Liability</h2>
        <p>
          We work hard to keep information accurate, but venues' details, hours and offers can
          change. {APP.name} is provided "as is" — to the fullest extent permitted by law we're not
          liable for losses arising from your use of the platform. Nothing in these terms limits
          your statutory rights as a consumer.
        </p>
      </section>
      <section>
        <h2>7. Changes</h2>
        <p>
          We may update these terms as the product evolves; material changes will be flagged on the
          site. See also our <Link to="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>.
        </p>
      </section>
    </LegalShell>
  )
}

export function Privacy() {
  return (
    <LegalShell title="Privacy Policy" updated="June 2026">
      <section>
        <h2>1. What we collect</h2>
        <p>
          Account details (name, email), the content you create (reviews, favourites, check-ins,
          bookings), and basic usage data that helps venues understand their audience (e.g. page
          views and search terms, aggregated). If you allow location access we use it only to show
          places near you — it isn't stored.
        </p>
      </section>
      <section>
        <h2>2. How we use it</h2>
        <p>
          To run the service: showing your reviews, managing your bookings and vouchers, and giving
          venue owners aggregate analytics. We don't sell your personal data, full stop.
        </p>
      </section>
      <section>
        <h2>3. Payments</h2>
        <p>
          Card payments are handled by Stripe. Your card number never touches our servers — Stripe
          shares only what's needed to confirm your purchase.
        </p>
      </section>
      <section>
        <h2>4. Business outreach</h2>
        <p>
          We occasionally contact businesses using publicly listed contact details to let them know
          their venue appears on {APP.name}. Every such email includes a one-click unsubscribe, and
          we honour opt-outs permanently. To opt out manually, email us.
        </p>
      </section>
      <section>
        <h2>5. Storage and third parties</h2>
        <p>
          Data is stored with Supabase (our database provider) and Stripe processes payments. We
          share data with them only as needed to run the service.
        </p>
      </section>
      <section>
        <h2>6. Your rights</h2>
        <p>
          Under UK GDPR you can request a copy of your data, correct it, or ask us to delete your
          account and everything tied to it. Email us and we'll action it within 30 days.
        </p>
      </section>
      <section>
        <h2>7. Cookies</h2>
        <p>
          We use only essential storage (keeping you signed in, remembering your city). No
          third-party advertising or tracking cookies.
        </p>
      </section>
    </LegalShell>
  )
}
