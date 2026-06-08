/**
 * POST /api/stripe-connect-link
 * Body: { businessId: string }
 *
 * Creates a Stripe Express account (if not already created) and returns an
 * onboarding URL. The return_url encodes the accountId + businessId so the
 * client can save them on completion.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { businessId } = req.body as { businessId?: string }
  if (!businessId) return res.status(400).json({ error: 'businessId required' })

  const origin = req.headers.origin ?? req.headers.host ?? 'https://localhost:5173'
  const base = origin.startsWith('http') ? origin : `https://${origin}`

  try {
    // Create a new Express connected account
    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: { transfers: { requested: true } },
      settings: { payouts: { schedule: { interval: 'daily' } } },
    })

    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${base}/business/stripe-connect?refresh=true&account=${account.id}&businessId=${businessId}`,
      return_url:  `${base}/business/stripe-connect?success=true&account=${account.id}&businessId=${businessId}`,
      type: 'account_onboarding',
    })

    return res.json({ url: link.url, accountId: account.id })
  } catch (err) {
    console.error('[stripe-connect-link]', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Stripe error' })
  }
}
