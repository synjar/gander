import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

/**
 * POST /api/outreach  — admin-only business-outreach engine (Worthing etc.)
 *
 * Auth: header `x-outreach-secret` must equal OUTREACH_ADMIN_SECRET.
 *
 * Body: { action, ...params }
 *   - seed     { town }            build outreach_leads from imported venues that have an email
 *   - list     { town }            return leads + stats for a town
 *   - stats    { town }            return status counts for a town
 *   - send     { town, limit }     send a throttled batch of cold invites (skips suppressed)
 *   - suppress { email, reason }   manually add an address to the suppression list
 *
 * Cold outreach is sent via a SEPARATE Resend domain (OUTREACH_RESEND_API_KEY +
 * OUTREACH_FROM) so it can never affect deliverability of transactional email.
 * Every message carries a one-click unsubscribe link + List-Unsubscribe headers.
 *
 * Required env:
 *   SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY,
 *   OUTREACH_ADMIN_SECRET, OUTREACH_RESEND_API_KEY, OUTREACH_FROM,
 *   OUTREACH_REPLY_TO, APP_URL (or VITE_APP_URL)
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const ADMIN_SECRET = process.env.OUTREACH_ADMIN_SECRET
const RESEND_KEY = process.env.OUTREACH_RESEND_API_KEY
const FROM = process.env.OUTREACH_FROM ?? 'Gander <hello@mail.gander.social>'
const REPLY_TO = process.env.OUTREACH_REPLY_TO ?? 'hello@gander.social'
const APP_URL = (process.env.APP_URL ?? process.env.VITE_APP_URL ?? 'https://gander.social').replace(/\/$/, '')

const MAX_BATCH = 20 // hard cap per invocation (Vercel timeout safety)
const SEND_DELAY_MS = 300 // throttle between sends

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** HMAC token tying an email to our secret — used for tamper-proof unsubscribe links. */
function unsubToken(email: string): string {
  return crypto.createHmac('sha256', ADMIN_SECRET ?? '').update(email.toLowerCase()).digest('hex')
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
}

interface Lead {
  id: string
  name: string
  email: string
  slug?: string
  category?: string
  town?: string
}

// Founder signature shown on the outreach email.
const CONTACT_NAME = process.env.OUTREACH_FROM_NAME ?? 'Jordan'
const CONTACT_PHONE = process.env.OUTREACH_PHONE ?? '+44 7749 358560'

/** The cold-invite email — auto-personalised per business, honest, easy opt-out. */
function buildEmail(lead: Lead): { subject: string; html: string; text: string } {
  const name = lead.name
  const town = lead.town ?? 'your area'
  const claimUrl = `${APP_URL}/business/join`
  const pageUrl = lead.slug ? `${APP_URL}/b/${lead.slug}` : `${APP_URL}/`
  const unsubUrl = `${APP_URL}/api/outreach-unsubscribe?e=${encodeURIComponent(lead.email)}&t=${unsubToken(lead.email)}`

  const subject = `${name} is already on Gander`

  const text = `Hi,

I run Gander — a local discovery app for ${town} (a friendly, UK-focused TripAdvisor for independent spots).

I've already added ${name} so locals can find you — here's your page: ${pageUrl}

If you claim it (about 2 minutes, free), you can add your photos, menu, hours and a deal, take bookings, reply to reviews, and see real numbers: how many people viewed you, what they searched, and what your reviews say.

On pricing I've tried to make it a no-brainer: free to list, your first 5 months are completely commission-free, and after that we only take 5% when we actually sell a voucher for you — nothing on bookings, no monthly fee, no setup cost. If we don't bring you customers, you pay nothing.

Claim ${name}: ${claimUrl}

Cheers,
${CONTACT_NAME} — Gander
${REPLY_TO} · ${CONTACT_PHONE}

Not for you? Unsubscribe and I won't email again: ${unsubUrl}`

  const html = `<!DOCTYPE html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:28px 24px;color:#1c1917;line-height:1.55">
  <p style="margin:0 0 14px">Hi,</p>
  <p style="margin:0 0 14px">I run <strong>Gander</strong> — a local discovery app for ${esc(town)} (a friendly, UK-focused TripAdvisor for independent spots).</p>
  <p style="margin:0 0 14px">I've already added <strong>${esc(name)}</strong> so locals can find you — here's your page:<br>
    <a href="${pageUrl}" style="color:#ea5009">${esc(pageUrl)}</a></p>
  <p style="margin:0 0 8px">If you claim it (about 2 minutes, free), you can:</p>
  <ul style="margin:0 0 16px;padding-left:20px;color:#44403c">
    <li>Add your photos, menu, hours and a deal</li>
    <li>Take bookings and reply to reviews</li>
    <li>See real numbers — who's viewing you, what they search, what your reviews say</li>
  </ul>
  <p style="margin:0 0 18px">On pricing I've tried to make it a no-brainer: <strong>free to list, your first 5 months are completely commission-free</strong>, and after that we only take <strong>5%</strong> when we actually sell a voucher for you — nothing on bookings, no monthly fee, no setup cost. If we don't bring you customers, you pay nothing.</p>
  <p style="margin:0 0 22px">
    <a href="${claimUrl}" style="display:inline-block;background:#f96a16;color:#fff;text-decoration:none;border-radius:100px;padding:12px 22px;font-weight:600">Claim ${esc(name)} — it's free</a>
  </p>
  <p style="margin:0;color:#57534e">Cheers,<br><strong>${esc(CONTACT_NAME)}</strong> — Gander<br>${esc(REPLY_TO)} · ${esc(CONTACT_PHONE)}</p>
  <hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0 12px">
  <p style="margin:0;color:#a8a29e;font-size:12px">You received this because <strong>${esc(name)}</strong> is a business publicly listed in ${esc(town)}, and we think Gander could send you customers. Gander, United Kingdom. Not for you? <a href="${unsubUrl}" style="color:#a8a29e">Unsubscribe</a> and we won't email again.</p>
</body></html>`

  return { subject, html, text }
}

function db(): SupabaseClient {
  return createClient(SUPABASE_URL as string, SERVICE_ROLE as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // --- Config + auth --------------------------------------------------------
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return res.status(500).json({ error: 'Server not configured: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing' })
  }
  if (!ADMIN_SECRET) {
    return res.status(500).json({ error: 'Server not configured: OUTREACH_ADMIN_SECRET missing' })
  }
  const provided = (req.headers['x-outreach-secret'] as string) ?? ''
  if (!provided || !timingSafeEqual(provided, ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorised' })
  }

  const { action } = (req.body ?? {}) as { action?: string }
  const supa = db()

  try {
    // --- SEED: build leads from imported venues that have an email ----------
    if (action === 'seed') {
      const { town } = req.body as { town?: string }
      if (!town) return res.status(400).json({ error: 'town required' })
      // Sanitise before using inside a PostgREST or-filter string
      const safeTown = town.replace(/[^a-zA-Z0-9 ]/g, '').trim()
      if (!safeTown) return res.status(400).json({ error: 'invalid town' })

      // Match the venue's neighbourhood OR anything with the town in its address,
      // so suburb-tagged venues (e.g. Broadwater) aren't missed. ALL unclaimed
      // venues are included (not just ones with an email) so the list doubles as
      // a phone/website/walk-in worklist.
      const { data: venues, error } = await supa
        .from('imported_businesses')
        .select('id, name, slug, email, phone, website, address, category, neighbourhood, city_id, claimed')
        .eq('claimed', false)
        .or(`neighbourhood.eq.${safeTown},address.ilike.*${safeTown}*`)
      if (error) throw error

      const rows = (venues ?? []).map((v) => {
        const email = ((v.email as string | null) ?? '').trim().toLowerCase()
        return {
          business_id: v.id,
          name: v.name,
          email: email.includes('@') ? email : null,
          phone: ((v.phone as string | null) ?? '') || null,
          website: ((v.website as string | null) ?? '') || null,
          address: ((v.address as string | null) ?? '') || null,
          slug: v.slug,
          category: v.category,
          town: safeTown,
          city_id: v.city_id,
          status: 'pending',
        }
      })

      if (rows.length === 0) return res.status(200).json({ added: 0, message: 'No venues found for this town. Import the town on the OSM panel above first.' })

      // Dedupe on the venue (business_id) — email may be null, so it can't be the key.
      // ignoreDuplicates keeps any status you've already set on existing leads.
      const { error: upErr } = await supa
        .from('outreach_leads')
        .upsert(rows, { onConflict: 'business_id', ignoreDuplicates: true })
      if (upErr) throw upErr

      const withEmail = rows.filter((r) => r.email).length
      return res.status(200).json({ added: rows.length, withEmail })
    }

    // --- LIST / STATS ------------------------------------------------------
    if (action === 'list' || action === 'stats') {
      const { town } = req.body as { town?: string }
      let q = supa.from('outreach_leads').select('id, name, email, phone, website, address, slug, category, town, status, sent_count, last_sent_at').order('name')
      if (town) q = q.eq('town', town)
      const { data: leads, error } = await q
      if (error) throw error

      const stats = { total: 0, pending: 0, sent: 0, opened: 0, replied: 0, claimed: 0, suppressed: 0, bounced: 0 } as Record<string, number>
      for (const l of leads ?? []) {
        stats.total++
        stats[l.status as string] = (stats[l.status as string] ?? 0) + 1
      }

      return res.status(200).json({ stats, leads: action === 'list' ? leads : undefined })
    }

    // --- SET STATUS (manual worklist progress) -----------------------------
    if (action === 'setStatus') {
      const { leadId, status } = req.body as { leadId?: string; status?: string }
      const allowed = ['pending', 'contacted', 'interested', 'claimed', 'not_interested', 'suppressed']
      if (!leadId || !status || !allowed.includes(status)) {
        return res.status(400).json({ error: 'leadId and a valid status are required' })
      }
      await supa.from('outreach_leads').update({ status }).eq('id', leadId)
      return res.status(200).json({ ok: true })
    }

    // --- SUPPRESS (manual) -------------------------------------------------
    if (action === 'suppress') {
      const { email, reason } = req.body as { email?: string; reason?: string }
      if (!email) return res.status(400).json({ error: 'email required' })
      const e = email.trim().toLowerCase()
      await supa.from('outreach_suppressions').upsert({ email: e, reason: reason ?? 'manual' }, { onConflict: 'email' })
      await supa.from('outreach_leads').update({ status: 'suppressed' }).eq('email', e)
      return res.status(200).json({ suppressed: e })
    }

    // --- SEND: throttled batch of cold invites -----------------------------
    if (action === 'send') {
      if (!RESEND_KEY) {
        return res.status(500).json({ error: 'OUTREACH_RESEND_API_KEY missing — set up a SEPARATE sending domain before sending (see OUTREACH.md)' })
      }
      const { town, limit } = req.body as { town?: string; limit?: number }
      const batch = Math.min(Math.max(1, limit ?? 12), MAX_BATCH)

      // Pull pending leads for the town that actually have an email address
      let q = supa.from('outreach_leads').select('id, name, email, slug, category, town').eq('status', 'pending').not('email', 'is', null).limit(batch)
      if (town) q = q.eq('town', town)
      const { data: leads, error } = await q
      if (error) throw error
      if (!leads || leads.length === 0) return res.status(200).json({ sent: 0, skipped: 0, message: 'No pending leads' })

      // Load suppression set for these addresses
      const emails = leads.map((l) => (l.email as string).toLowerCase())
      const { data: supp } = await supa.from('outreach_suppressions').select('email').in('email', emails)
      const suppressed = new Set((supp ?? []).map((s) => (s.email as string).toLowerCase()))

      let sent = 0
      let skipped = 0
      const failures: string[] = []

      for (const lead of leads as Lead[]) {
        const email = lead.email.toLowerCase()
        if (suppressed.has(email)) {
          await supa.from('outreach_leads').update({ status: 'suppressed' }).eq('id', lead.id)
          skipped++
          continue
        }

        const { subject, html, text } = buildEmail(lead)
        const unsubUrl = `${APP_URL}/api/outreach-unsubscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`

        try {
          const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
            body: JSON.stringify({
              from: FROM,
              to: email,
              reply_to: REPLY_TO,
              subject,
              html,
              text,
              headers: {
                'List-Unsubscribe': `<${unsubUrl}>, <mailto:${REPLY_TO}?subject=unsubscribe>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              },
            }),
          })
          if (!r.ok) {
            failures.push(email)
            continue
          }
          await supa.from('outreach_leads').update({
            status: 'sent',
            sent_count: 1,
            last_sent_at: new Date().toISOString(),
          }).eq('id', lead.id)
          sent++
        } catch {
          failures.push(email)
        }

        await sleep(SEND_DELAY_MS)
      }

      return res.status(200).json({ sent, skipped, failures: failures.length, failureEmails: failures })
    }

    return res.status(400).json({ error: `Unknown action: ${action}` })
  } catch (err) {
    console.error('[outreach] error:', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unexpected error' })
  }
}
