/**
 * Reusable outreach message templates (plain text), auto-personalised per lead.
 * Used by the admin outreach console's per-lead "Message" composer so you can
 * fire off the right message on the right channel in a click.
 */

export interface OutreachLeadLike {
  name: string
  town?: string | null
  slug?: string | null
}

export const OUTREACH_CONTACT = {
  name: 'Jordan',
  email: 'jordanhummel10@gmail.com',
  phone: '+44 7749 358560',
}

function appOrigin(): string {
  return (
    (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://gander.social')
  )
}

function listingUrl(lead: OutreachLeadLike): string {
  return lead.slug ? `${appOrigin()}/b/${lead.slug}` : `${appOrigin()}/business`
}

const sig = `${OUTREACH_CONTACT.name} — Gander\n${OUTREACH_CONTACT.email} · ${OUTREACH_CONTACT.phone}`

export interface EmailContent {
  subject: string
  body: string
}

export type TemplateKey = 'intro' | 'followUp' | 'final' | 'whatsapp'

export const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  intro: 'Email · Intro',
  followUp: 'Email · Follow-up',
  final: 'Email · Final note',
  whatsapp: 'WhatsApp',
}

export function introEmail(lead: OutreachLeadLike): EmailContent {
  const town = lead.town || 'your area'
  return {
    subject: `${lead.name} is already on Gander`,
    body: `Hi,

I run Gander — a local discovery app for ${town} (a friendly, UK-focused TripAdvisor for independent spots).

I've already added ${lead.name} so locals can find you — here's your page: ${listingUrl(lead)}

If you claim it (about 2 minutes, free), you can add your photos, menu, hours and a deal, take bookings, reply to reviews, and see real numbers: how many people viewed you, what they searched, and what your reviews say.

On pricing I've tried to make it a no-brainer: free to list, your first 5 months are completely commission-free, and after that we only take 5% when we actually sell a voucher for you — nothing on bookings, no monthly fee, no setup cost. If we don't bring you customers, you pay nothing.

Want me to send the claim link, or pop in for a 2-minute look?

Cheers,
${sig}`,
  }
}

export function followUpEmail(lead: OutreachLeadLike): EmailContent {
  const town = lead.town || 'your area'
  return {
    subject: `re: ${lead.name} on Gander`,
    body: `Hi,

Just floating this back to the top of your inbox in case it got buried.

${lead.name} is already on Gander — locals in ${town} can find you right now: ${listingUrl(lead)}

The bit most owners like: it's free to list, and your first 5 months are completely commission-free (after that just 5%, only when we actually sell something for you — nothing on bookings). So there's genuinely no cost or risk to claiming it.

You'd also get a simple dashboard showing how many people are viewing you and what they're searching.

Want me to send the claim link, or walk you through it in 2 minutes?

Cheers,
${sig}`,
  }
}

export function finalEmail(lead: OutreachLeadLike): EmailContent {
  const town = lead.town || 'your area'
  return {
    subject: `Last one — ${lead.name}`,
    body: `Hi,

I won't keep cluttering your inbox — this is the last I'll send.

If getting ${lead.name} in front of more ${town} locals is ever useful, your page is right here and free to claim anytime: ${listingUrl(lead)}

No pressure at all — just wanted you to know the door's open. Either way, wishing you and the team a brilliant year.

Cheers,
${sig}`,
  }
}

export function whatsappMessage(lead: OutreachLeadLike): string {
  const town = lead.town || 'your area'
  return `Hi 👋 I'm ${OUTREACH_CONTACT.name} — I run Gander, a local discovery app for ${town} (helps people find good independent spots).

I've already added ${lead.name} so locals can find you: ${listingUrl(lead)}

It's free to claim (~2 mins), first 5 months commission-free then just 5%, only when we actually sell something for you. Want me to send the link, or easier if I call? 🙂`
}

/** Convert a UK/intl phone string into a wa.me-ready number (digits only, +44…). */
export function waNumber(phone: string): string {
  let p = phone.replace(/[^\d+]/g, '')
  if (p.startsWith('+')) p = p.slice(1)
  if (p.startsWith('0')) p = '44' + p.slice(1) // UK local → international
  return p
}
