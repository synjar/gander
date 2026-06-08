import type { VercelRequest, VercelResponse } from '@vercel/node'

// POST /api/send-email
// Body: { to: string; subject: string; html: string }
//
// Requires RESEND_API_KEY env var. If absent, returns {skipped:true} with 200
// so email failures never break the caller's UX.
//
// Set RESEND_FROM_EMAIL to your verified domain address (e.g. noreply@yourdomain.com).
// Defaults to onboarding@resend.dev which only works for Resend account owner's email.

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'Gander <onboarding@resend.dev>'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Graceful no-op if Resend isn't configured
  if (!RESEND_API_KEY) {
    return res.status(200).json({ skipped: true, reason: 'RESEND_API_KEY not set' })
  }

  const { to, subject, html } = req.body as {
    to?: string
    subject?: string
    html?: string
  }

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' })
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const err = (await response.json()) as unknown
      console.error('[send-email] Resend error:', err)
      return res.status(500).json({ error: 'Email provider error', details: err })
    }

    const data = (await response.json()) as { id?: string }
    return res.status(200).json({ sent: true, id: data.id })
  } catch (err) {
    console.error('[send-email] Unexpected error:', err)
    return res.status(500).json({ error: 'Unexpected error sending email' })
  }
}
