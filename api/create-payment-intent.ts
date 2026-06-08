/**
 * POST /api/create-payment-intent
 * Body: { amount: number, stripeAccountId?: string }
 *
 * Creates a Stripe PaymentIntent.
 * If stripeAccountId is supplied (the merchant's connected account),
 * Gander keeps a 15% application fee and the rest transfers to the merchant.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const PLATFORM_FEE_RATE = 0.15 // 15% to Gander

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { amount, stripeAccountId } = req.body as {
    amount?: number
    stripeAccountId?: string
  }

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })

  try {
    const amountPence = Math.round(amount * 100)

    const params: Stripe.PaymentIntentCreateParams = {
      amount: amountPence,
      currency: 'gbp',
      automatic_payment_methods: { enabled: true },
    }

    // If merchant has connected their Stripe account, split the payment
    if (stripeAccountId) {
      params.application_fee_amount = Math.round(amountPence * PLATFORM_FEE_RATE)
      params.transfer_data = { destination: stripeAccountId }
    }

    const pi = await stripe.paymentIntents.create(params)
    return res.json({ clientSecret: pi.client_secret })
  } catch (err) {
    console.error('[create-payment-intent]', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Stripe error' })
  }
}
