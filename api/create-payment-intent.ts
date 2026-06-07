import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const amount = (req.body as { amount?: number }).amount ?? 0
  if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' })

  try {
    const pi = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert £ to pence
      currency: 'gbp',
      automatic_payment_methods: { enabled: true },
    })
    return res.json({ clientSecret: pi.client_secret })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Stripe error' })
  }
}
