import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/weekly-digest  — sends each claimed merchant a "your Gander week"
 * summary email. Triggered weekly by Vercel Cron (see vercel.json).
 *
 * Auth: Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>`
 * when the CRON_SECRET env var is set, so we just compare against it.
 *
 * This is transactional (a merchant's own account summary), so it correctly
 * uses the main RESEND_API_KEY / domain — not the cold-outreach domain.
 *
 * Required env: SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY,
 * CRON_SECRET, RESEND_API_KEY, RESEND_FROM_EMAIL, APP_URL (or VITE_APP_URL).
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const CRON_SECRET = process.env.CRON_SECRET
const RESEND_KEY = process.env.RESEND_API_KEY
const FROM = process.env.RESEND_FROM_EMAIL ?? 'Gander <onboarding@resend.dev>'
const APP_URL = (process.env.APP_URL ?? process.env.VITE_APP_URL ?? 'https://gander.social').replace(/\/$/, '')

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface Summary {
  views: number
  actions: number
  bookings: number
  reviews: number
}

function digestHtml(name: string, s: Summary): string {
  const stat = (value: number, label: string) =>
    `<td style="padding:0 8px;text-align:center"><div style="font-size:30px;font-weight:700;color:#1c1917">${value}</div><div style="font-size:12px;color:#78716c">${label}</div></td>`
  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1c1917">
  <div style="font-size:26px;margin-bottom:6px">🪢</div>
  <h1 style="font-size:22px;font-weight:700;margin:0 0 4px">Your Gander week</h1>
  <p style="color:#57534e;margin:0 0 20px"><strong>${name}</strong> · last 7 days</p>
  <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:16px;padding:20px 8px;margin-bottom:22px">
    <table style="width:100%;border-collapse:collapse"><tr>
      ${stat(s.views, 'profile views')}
      ${stat(s.actions, 'customer actions')}
      ${stat(s.bookings, 'bookings')}
      ${stat(s.reviews, 'new reviews')}
    </tr></table>
  </div>
  <a href="${APP_URL}/business/dashboard" style="display:inline-block;background:#f96a16;color:#fff;text-decoration:none;border-radius:100px;padding:12px 24px;font-weight:600;font-size:14px">Open your dashboard →</a>
  <p style="color:#78716c;font-size:14px;margin-top:20px">Tip: replying to reviews and posting a deal are the fastest ways to lift these numbers.</p>
  <p style="color:#a8a29e;font-size:12px;margin-top:28px;border-top:1px solid #e7e5e4;padding-top:16px">You're receiving this weekly summary because you manage ${name} on Gander.</p>
</body></html>`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // --- Auth (Vercel Cron bearer) -------------------------------------------
  if (!CRON_SECRET || req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorised' })
  }
  if (!SUPABASE_URL || !SERVICE_ROLE) return res.status(500).json({ error: 'Supabase not configured' })
  if (!RESEND_KEY) return res.status(500).json({ error: 'RESEND_API_KEY missing' })

  const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } })
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString()

  // Claimed venues with an owner to email
  const { data: venues, error } = await supa
    .from('imported_businesses')
    .select('id, name, claimed_by')
    .eq('claimed', true)
    .not('claimed_by', 'is', null)
    .limit(500)
  if (error) return res.status(500).json({ error: error.message })

  let sent = 0
  let skipped = 0

  for (const v of venues ?? []) {
    const bid = v.id as string
    const [{ data: events }, bookingsRes, reviewsRes] = await Promise.all([
      supa.from('business_events').select('type').eq('business_id', bid).gte('created_at', since),
      supa.from('bookings').select('*', { count: 'exact', head: true }).eq('business_id', bid).gte('created_at', since),
      supa.from('reviews').select('*', { count: 'exact', head: true }).eq('business_id', bid).gte('created_at', since),
    ])

    const views = (events ?? []).filter((e) => e.type === 'view').length
    const actions = (events ?? []).filter((e) => ['phone', 'directions', 'website'].includes(e.type as string)).length
    const summary: Summary = { views, actions, bookings: bookingsRes.count ?? 0, reviews: reviewsRes.count ?? 0 }

    // Skip dead weeks — don't nag merchants with all-zero emails
    if (summary.views + summary.actions + summary.bookings + summary.reviews === 0) { skipped++; continue }

    // Look up the owner's email (admin API — service role only)
    const { data: u } = await supa.auth.admin.getUserById(v.claimed_by as string)
    const email = u?.user?.email
    if (!email) { skipped++; continue }

    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({
          from: FROM,
          to: email,
          subject: `Your Gander week — ${v.name}`,
          html: digestHtml(v.name as string, summary),
        }),
      })
      if (r.ok) sent++
      else skipped++
    } catch {
      skipped++
    }
    await sleep(200) // gentle throttle
  }

  return res.status(200).json({ processed: venues?.length ?? 0, sent, skipped })
}
