import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

/**
 * GET/POST /api/outreach-unsubscribe?e=<email>&t=<token>
 *
 * Public, no auth — but the token is an HMAC of the email under
 * OUTREACH_ADMIN_SECRET, so links can't be forged or enumerated. Adds the
 * address to outreach_suppressions and marks any matching lead suppressed.
 *
 * Supports RFC 8058 one-click unsubscribe (POST) for inbox "Unsubscribe"
 * buttons, and a normal GET for the link in the email body.
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const ADMIN_SECRET = process.env.OUTREACH_ADMIN_SECRET

function expectedToken(email: string): string {
  return crypto.createHmac('sha256', ADMIN_SECRET ?? '').update(email.toLowerCase()).digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

function page(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#fafaf9;color:#1c1917;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">
  <div style="max-width:420px;padding:40px 28px;text-align:center">
    <div style="font-size:34px;margin-bottom:12px">🪢</div>
    <h1 style="font-size:20px;margin:0 0 8px">${title}</h1>
    <p style="color:#57534e;margin:0">${body}</p>
  </div>
</body></html>`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const e = (req.query.e as string) ?? ''
  const t = (req.query.t as string) ?? ''
  const email = e.trim().toLowerCase()

  const isPost = req.method === 'POST'

  if (!SUPABASE_URL || !SERVICE_ROLE || !ADMIN_SECRET) {
    if (isPost) return res.status(500).end()
    return res.status(500).send(page('Something went wrong', 'This unsubscribe link is temporarily unavailable. Please reply to the email and we will remove you.'))
  }

  if (!email || !t || !safeEqual(t, expectedToken(email))) {
    if (isPost) return res.status(400).end()
    return res.status(400).send(page('Invalid link', 'This unsubscribe link is invalid or has expired. Please reply to the email and we will remove you.'))
  }

  try {
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    await supa.from('outreach_suppressions').upsert({ email, reason: 'unsubscribed' }, { onConflict: 'email' })
    await supa.from('outreach_leads').update({ status: 'suppressed' }).eq('email', email)
  } catch (err) {
    console.error('[outreach-unsubscribe] error:', err)
    if (isPost) return res.status(500).end()
    return res.status(500).send(page('Something went wrong', 'We could not process that just now. Please reply to the email and we will remove you.'))
  }

  // RFC 8058 one-click: just acknowledge with 200, no body needed.
  if (isPost) return res.status(200).end()

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  return res.status(200).send(
    page("You're unsubscribed", `We won't email <strong>${email.replace(/[<>&]/g, '')}</strong> again. Sorry for the interruption.`),
  )
}
