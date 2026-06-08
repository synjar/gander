# Gander — business outreach engine

A built-in tool (Admin → **Business outreach**) for inviting unclaimed local
venues to claim their Gander listing. It turns the venues you've already
imported from OpenStreetMap into a per-town lead list, then sends throttled,
opt-out-respecting invites.

**The funnel:** OSM import (with emails) → build lead list for a town →
personalised "your page already exists, claim it free" email → they land on
their live listing / onboarding → claimed merchant.

---

## ⚠️ Read this first — the law (UK)

Cold B2B email in the UK is governed by **PECR** and **UK GDPR**. The short version:

- **Limited companies / LLPs** ("corporate subscribers") — you may email B2B
  marketing **without prior consent**, provided you identify yourself and offer
  an opt-out. This tool does both.
- **Sole traders & partnerships** — treated like individuals under PECR, so they
  need consent or a "soft opt-in". Most independent cafés/barbers are sole
  traders, so **be cautious**: prefer ones you have some relationship with, keep
  volume low, and stop the moment someone objects.
- **Always:** tell them who you are, why they're getting it, and give a working
  one-click unsubscribe (built in). **Honour every opt-out immediately** (the
  suppression list does this automatically and permanently).
- Keep your sending volume modest and genuinely useful. This is an invitation to
  a service that benefits them, not a bulk blast.

This is a practical summary, **not legal advice** — if in doubt, check the ICO's
guidance on electronic marketing.

## ⚠️ Read this second — deliverability (don't skip)

If you get this wrong you can permanently damage your domain's ability to land
in inboxes — including your **booking confirmations and voucher receipts**.

- **Use a SEPARATE sending domain** for outreach (e.g. `mail.gander.social` or a
  dedicated `.co.uk`). Never send cold email from the same domain/identity as
  your transactional mail. The engine is wired to use its own
  `OUTREACH_RESEND_API_KEY` + `OUTREACH_FROM` precisely so the two never mix.
- **Most transactional ESPs (Resend, Postmark, SendGrid) restrict unsolicited
  email in their AUP.** A separate domain protects *your* reputation, but confirm
  your provider permits B2B outreach — or use a provider/domain dedicated to it.
  The endpoint speaks the Resend API; point `OUTREACH_RESEND_API_KEY` at whatever
  Resend account/domain you've designated for outreach.
- **Set up SPF, DKIM and DMARC** on the outreach domain (Resend walks you through
  the DNS records when you add+verify the domain).
- **Warm up:** start with a handful a day and ramp slowly. The batch cap (max 20
  per send, default 12) and the per-send throttle exist to keep you honest.
- A reply-to at a real, monitored inbox (`OUTREACH_REPLY_TO`) hugely improves both
  replies and deliverability.

---

## One-time setup

### 1. Run the SQL migration (Supabase → SQL editor)

```sql
-- Capture emails on imported venues
alter table public.imported_businesses add column if not exists email text;

-- Outreach leads (per-business worklist + status tracking).
-- email is OPTIONAL so the list works as a phone/website/visit worklist too;
-- leads are de-duped on business_id (the venue), not email.
create table if not exists public.outreach_leads (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid unique references public.imported_businesses(id) on delete set null,
  name         text not null,
  email        text,
  phone        text,
  website      text,
  address      text,
  slug         text,
  category     text,
  town         text,
  city_id      text,
  status       text not null default 'pending', -- pending|contacted|sent|interested|claimed|not_interested|suppressed
  sent_count   int  not null default 0,
  last_sent_at timestamptz,
  created_at   timestamptz not null default now()
);

-- Already ran an earlier version of this table (email NOT NULL)? Run this delta:
--   alter table public.outreach_leads alter column email drop not null;
--   alter table public.outreach_leads drop constraint if exists outreach_leads_email_key;
--   alter table public.outreach_leads add column if not exists phone text;
--   alter table public.outreach_leads add column if not exists website text;
--   alter table public.outreach_leads add column if not exists address text;
--   do $$ begin
--     alter table public.outreach_leads add constraint outreach_leads_business_id_key unique (business_id);
--   exception when duplicate_object then null; end $$;

-- Suppression list (never email these again)
create table if not exists public.outreach_suppressions (
  email      text primary key,
  reason     text,                       -- unsubscribed|bounced|complaint|manual
  created_at timestamptz not null default now()
);

-- Lock down: only the service role (used by the API) may read/write these.
alter table public.outreach_leads enable row level security;
alter table public.outreach_suppressions enable row level security;
-- No policies = anon/authenticated clients are denied; the service_role key bypasses RLS.
```

### 2. Designate a separate outreach domain

In Resend (or your chosen provider), add and verify a **separate** domain/subdomain
for outreach and complete its SPF/DKIM/DMARC DNS records. Create an API key scoped
to it.

### 3. Set environment variables (Vercel → Settings → Environment Variables)

| Variable | Value |
| -------- | ----- |
| `SUPABASE_URL` | Your Supabase project URL (same as `VITE_SUPABASE_URL`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → **service_role** key. **Server-only — never prefix with `VITE_`.** |
| `OUTREACH_ADMIN_SECRET` | A long random string you invent. Unlocks the admin panel and signs unsubscribe links. |
| `OUTREACH_RESEND_API_KEY` | Resend API key for your **separate** outreach domain. |
| `OUTREACH_FROM` | e.g. `Jordan at Gander <jordan@mail.gander.social>` (a real name converts better) |
| `OUTREACH_REPLY_TO` | A real, monitored inbox, e.g. `jordan@gander.social` |
| `APP_URL` | `https://gander.social` |

> The Supabase **service role** key and `OUTREACH_ADMIN_SECRET` are powerful —
> they live only in Vercel server env, never in the client bundle.

---

## Running a campaign (e.g. Worthing)

The list works as a **phone / website / walk-in worklist** with no email setup at
all. Email sending is an optional extra (the collapsed section at the bottom of
the panel) that only lights up once the outreach domain is configured.

1. **Import the town's venues:** Admin → OSM import panel, import West Sussex. The
   import captures each venue's `phone`, `website` and (where present) `email`.
2. **Unlock the panel:** Admin → Business outreach → enter `OUTREACH_ADMIN_SECRET`.
3. **Build list:** set Town = `Worthing`, click **Build list**. This pulls every
   unclaimed Worthing venue (matching the neighbourhood or anything with "Worthing"
   in its address) with its phone, website and address.
4. **Work the list:** call / visit / use their website contact form. Tap each
   lead's status as you go: **To contact → Contacted → Interested → Claimed**
   (or *Not interested*). Use **Export CSV** if you'd rather work it offline.
5. **(Optional) Email:** once the outreach domain is set up, open *Automated email
   outreach* and **Send next batch** to the venues that have an email — start small
   (5–10/day) and watch for replies before ramping.

### Lead statuses

| Status | Meaning |
| ------ | ------- |
| `pending` | On the list, not yet contacted |
| `contacted` | You've called / messaged / visited |
| `sent` | A cold invite email was sent (auto, optional email flow) |
| `interested` | They're keen — follow up |
| `claimed` | They claimed their listing 🎉 |
| `not_interested` | Said no — leave them be |
| `suppressed` | Unsubscribed / do-not-contact — never emailed again |

---

## How opt-out works

Every email carries a one-click unsubscribe link plus `List-Unsubscribe` /
`List-Unsubscribe-Post` headers (RFC 8058), so inbox "Unsubscribe" buttons work
too. The link is an HMAC of the recipient's address under `OUTREACH_ADMIN_SECRET`,
so it can't be forged or used to enumerate addresses. Clicking it adds the address
to `outreach_suppressions` permanently; every send checks the suppression list
first and skips anyone on it.

---

## Limitations / natural next steps

- **Open/click/bounce tracking** isn't wired yet (statuses `opened` / `bounced` /
  `replied` are manual). Resend webhooks could automate these.
- **Claim attribution** is manual. Building the dedicated "claim this listing"
  flow (and tagging the inbound source) would close the loop end-to-end.
- **Email coverage is sparse** in OSM (~10–15%). For the rest you have a **phone
  and website** on each venue — the highest-converting channel for local indies is
  often a quick call or an in-person visit. Consider the email as one prong of a
  multi-channel push.
