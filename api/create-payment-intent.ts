/**
 * POST /api/create-payment-intent
 * Body: { amount: number, stripeAccountId?: string, businessId?: string }
 *
 * Creates a Stripe PaymentIntent. If stripeAccountId is supplied (the merchant's
 * connected account), the payment is split: Gander keeps a platform fee and the
 * rest transfers to the merchant.
 *
 * Commission model (computed server-side — never trust the client):
 *   - A merchant's first month after claiming their venue is commission-free.
 *   - After that, Gander takes 12% of each sale it makes for them.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const BASE_FEE_RATE = 0.12 // 12% to Gander after the free first month
const FREE_MONTH_MS = 30 * 24 * 60 * 60 * 1000

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

/** Resolve the platform fee rate for a business: 0 during its free first month. */
async function feeRateFor(businessId?: string): Promise<number> {
  if (!businessId || !SUPABASE_URL || !SERVICE_ROLE) return BASE_FEE_RATE
  try {
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data } = await supa
      .from('imported_businesses')
      .select('claimed_at')
      .eq('id', businessId)
      .maybeSingle()
    const claimedAt = data?.claimed_at ? new Date(data.claimed_at as string).getTime() : null
    if (claimedAt && Date.now() < claimedAt + FREE_MONTH_MS) return 0
  } catch {
    /* fall back to the base rate */
  }
  return BASE_FEE_RATE
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { amount, stripeAccountId, businessId } = req.body as {
    amount?: number
    stripeAccountId?: string
    businessId?: string
  }

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })

  try {
    const amountPence = Math.round(amount * 100)
    const feeRate = stripeAccountId ? await feeRateFor(businessId) : BASE_FEE_RATE

    const params: Stripe.PaymentIntentCreateParams = {
      amount: amountPence,
      currency: 'gbp',
      automatic_payment_methods: { enabled: true },
    }

    // Split the payment to the merchant's connected account. During the free
    // first month feeRate is 0, so the whole amount transfers to them.
    if (stripeAccountId) {
      if (feeRate > 0) params.application_fee_amount = Math.round(amountPence * feeRate)
      params.transfer_data = { destination: stripeAccountId }
    }

    const pi = await stripe.paymentIntents.create(params)
    return res.json({ clientSecret: pi.client_secret, feeRate })
  } catch (err) {
    console.error('[create-payment-intent]', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Stripe error' })
  }
}
