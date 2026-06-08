/**
 * Client-side email helpers — call /api/send-email which proxies to Resend.
 * Never throws: email failures are non-fatal and should never break the UX.
 * If RESEND_API_KEY isn't set, the endpoint returns {skipped:true} silently.
 */

async function callApi(payload: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    console.warn('[gander] email send failed (non-fatal):', e)
  }
}

// ---- Booking confirmation ---------------------------------------------------

export async function sendBookingConfirmation(opts: {
  to: string
  name: string
  businessName: string
  date: string
  time: string
  partySize: number
  occasion?: string
}): Promise<void> {
  await callApi({
    to: opts.to,
    subject: `Booking confirmed — ${opts.businessName}`,
    html: `<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1c1917">
  <div style="font-size:28px;margin-bottom:16px">🪢</div>
  <h1 style="font-size:22px;font-weight:700;margin:0 0 8px">Booking confirmed!</h1>
  <p style="color:#57534e;margin:0 0 24px">Hi ${opts.name}, your reservation at <strong>${opts.businessName}</strong> is all set.</p>
  <div style="background:#f5f5f4;border-radius:12px;padding:20px;margin-bottom:24px">
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:4px 0;color:#78716c;font-size:14px;width:100px">Venue</td><td style="padding:4px 0;font-weight:600">${opts.businessName}</td></tr>
      <tr><td style="padding:4px 0;color:#78716c;font-size:14px">Date</td><td style="padding:4px 0">${opts.date}</td></tr>
      <tr><td style="padding:4px 0;color:#78716c;font-size:14px">Time</td><td style="padding:4px 0">${opts.time}</td></tr>
      <tr><td style="padding:4px 0;color:#78716c;font-size:14px">Party</td><td style="padding:4px 0">${opts.partySize} ${opts.partySize === 1 ? 'person' : 'people'}${opts.occasion ? ` · ${opts.occasion}` : ''}</td></tr>
    </table>
  </div>
  <p style="color:#78716c;font-size:14px">To manage your booking visit <a href="https://gander.social/me" style="color:#e07b39">your profile</a> on Gander.</p>
  <p style="color:#a8a29e;font-size:12px;margin-top:32px;border-top:1px solid #e7e5e4;padding-top:16px">You're receiving this because you made a booking via Gander.</p>
</body></html>`,
  })
}

// ---- Deal / voucher receipt -------------------------------------------------

export async function sendDealReceipt(opts: {
  to: string
  name: string
  businessName: string
  dealTitle: string
  price: string
  code: string
}): Promise<void> {
  await callApi({
    to: opts.to,
    subject: `Your Gander voucher — ${opts.businessName}`,
    html: `<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1c1917">
  <div style="font-size:28px;margin-bottom:16px">🎟️</div>
  <h1 style="font-size:22px;font-weight:700;margin:0 0 8px">Your voucher is ready</h1>
  <p style="color:#57534e;margin:0 0 24px">Hi ${opts.name}, here's your deal from <strong>${opts.businessName}</strong>.</p>
  <div style="background:#f5f5f4;border-radius:12px;padding:20px;margin-bottom:24px">
    <p style="margin:0 0 4px;font-weight:600">${opts.dealTitle}</p>
    <p style="margin:0 0 16px;color:#57534e;font-size:14px">Amount paid: <strong>${opts.price}</strong></p>
    <p style="margin:0 0 6px;font-size:12px;color:#78716c;text-transform:uppercase;letter-spacing:0.05em">Your voucher code</p>
    <p style="margin:0;font-family:monospace;font-size:24px;font-weight:700;letter-spacing:3px;color:#e07b39">${opts.code}</p>
  </div>
  <p style="color:#78716c;font-size:14px">Show this code at the venue, or let them scan your QR from the Gander app. Enjoy! 🎉</p>
  <p style="color:#a8a29e;font-size:12px;margin-top:32px;border-top:1px solid #e7e5e4;padding-top:16px">You're receiving this because you purchased a deal via Gander.</p>
</body></html>`,
  })
}

// ---- Business approved ------------------------------------------------------

export async function sendBusinessApproved(opts: {
  to: string
  businessName: string
}): Promise<void> {
  await callApi({
    to: opts.to,
    subject: `Your listing is live — ${opts.businessName}`,
    html: `<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1c1917">
  <div style="font-size:28px;margin-bottom:16px">🚀</div>
  <h1 style="font-size:22px;font-weight:700;margin:0 0 8px">You're live on Gander!</h1>
  <p style="color:#57534e;margin:0 0 16px"><strong>${opts.businessName}</strong> has been approved and is now discoverable by thousands of local food lovers.</p>
  <a href="https://gander.social/business/dashboard"
     style="display:inline-block;background:#e07b39;color:#fff;text-decoration:none;border-radius:100px;padding:12px 24px;font-weight:600;font-size:14px;margin-bottom:24px">
    Open your dashboard →
  </a>
  <p style="color:#78716c;font-size:14px">From your dashboard you can: add photos, edit your listing details, set opening hours, create deals &amp; vouchers, and respond to reviews.</p>
  <p style="color:#a8a29e;font-size:12px;margin-top:32px;border-top:1px solid #e7e5e4;padding-top:16px">You're receiving this because you submitted a business listing to Gander.</p>
</body></html>`,
  })
}

// ---- New booking alert (to merchant) ----------------------------------------

export async function sendNewBookingAlert(opts: {
  to: string
  businessName: string
  customerName: string
  date: string
  time: string
  partySize: number
  occasion?: string
}): Promise<void> {
  await callApi({
    to: opts.to,
    subject: `New booking at ${opts.businessName} — ${opts.date}`,
    html: `<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1c1917">
  <div style="font-size:28px;margin-bottom:16px">📅</div>
  <h1 style="font-size:22px;font-weight:700;margin:0 0 8px">New booking received</h1>
  <p style="color:#57534e;margin:0 0 24px">A customer just booked a table at <strong>${opts.businessName}</strong> via Gander.</p>
  <div style="background:#f5f5f4;border-radius:12px;padding:20px;margin-bottom:24px">
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:4px 0;color:#78716c;font-size:14px;width:110px">Customer</td><td style="padding:4px 0;font-weight:600">${opts.customerName}</td></tr>
      <tr><td style="padding:4px 0;color:#78716c;font-size:14px">Date</td><td style="padding:4px 0">${opts.date}</td></tr>
      <tr><td style="padding:4px 0;color:#78716c;font-size:14px">Time</td><td style="padding:4px 0">${opts.time}</td></tr>
      <tr><td style="padding:4px 0;color:#78716c;font-size:14px">Party</td><td style="padding:4px 0">${opts.partySize} ${opts.partySize === 1 ? 'person' : 'people'}${opts.occasion ? ` · ${opts.occasion}` : ''}</td></tr>
    </table>
  </div>
  <a href="https://gander.social/business/dashboard"
     style="display:inline-block;background:#e07b39;color:#fff;text-decoration:none;border-radius:100px;padding:12px 24px;font-weight:600;font-size:14px;margin-bottom:24px">
    View in dashboard →
  </a>
  <p style="color:#a8a29e;font-size:12px;margin-top:32px;border-top:1px solid #e7e5e4;padding-top:16px">You're receiving this because you manage a listing on Gander.</p>
</body></html>`,
  })
}
