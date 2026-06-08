# Gander — merchant analytics

Real engagement analytics for the merchant dashboard, so business owners can see
that Gander is actually sending them customers (the thing that turns a free
listing into a paid one).

## What's now tracked (real)

Every time a customer interacts with a listing, a row is written to
`business_events`:

| Event | Logged when… |
| ----- | ------------ |
| `view` | someone opens the business page |
| `phone` | they tap the phone number |
| `directions` | they pick a maps app from "Get directions" |
| `website` | they tap the website link |

The dashboard turns these into:
- **Profile views** (real, last 30 days) — replaces the old estimate
- **Customer actions** — calls + directions + website taps
- **Conversion** — % of viewers who took an action
- **Daily views** sparkline (last 14 days)
- **Action breakdown** — calls / directions / website
- **Saves** — real count of users who favourited the venue
- **Local rank** — `#3 of 18 cafés in Worthing`, computed from ratings of
  same-category venues in the same city

Voucher revenue, vouchers sold and bookings-by-day were already real.

## One-time setup — run this SQL (Supabase → SQL editor)

```sql
-- Engagement events ---------------------------------------------------------
create table if not exists public.business_events (
  id          bigint generated always as identity primary key,
  business_id text not null,
  type        text not null,           -- view|phone|directions|website|menu|share
  query       text,                    -- search term that surfaced the listing (view events)
  created_at  timestamptz not null default now()
);
-- If the table already existed without it:
alter table public.business_events add column if not exists query text;
create index if not exists business_events_biz_time_idx
  on public.business_events (business_id, created_at desc);

alter table public.business_events enable row level security;

-- Anyone (including anonymous visitors) may LOG an event, but only known types,
-- and nobody can read or alter events through this policy.
create policy "business_events_insert" on public.business_events
  for insert to anon, authenticated
  with check (type in ('view','phone','directions','website','menu','share'));

-- Merchants (signed in) read aggregate engagement for the dashboard.
create policy "business_events_select" on public.business_events
  for select to authenticated
  using (true);

-- Real "saves" count -------------------------------------------------------
-- favourites is RLS-restricted to each user's own rows, so counting everyone's
-- saves needs a SECURITY DEFINER function.
create or replace function public.business_favourite_count(p_business_id text)
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::int from public.favourites where business_id = p_business_id;
$$;
grant execute on function public.business_favourite_count(text) to anon, authenticated;
```

That's it — no env vars. Events start flowing as soon as the SQL is in place and
the new build is deployed.

## Notes

- **Privacy:** events store only `business_id` + `type` + timestamp. No user id,
  IP or personal data — they're pure counters, so they're safe under GDPR and
  there's nothing to leak if the select policy is broad.
- **Demo mode:** with no Supabase backend, the dashboard falls back to a gentle
  estimate for views/saves so it isn't empty. Real numbers appear once events
  are flowing.
- **Backfill:** there's no historical data — analytics begin from the moment the
  table exists. The first day will read low; that's expected.

## Weekly digest email (cron)

`api/weekly-digest.ts` emails each claimed merchant a "Your Gander week" summary
(views, customer actions, bookings, new reviews) every Monday at 08:00. It's
wired in `vercel.json` as a Vercel Cron. Dead weeks (all zeros) are skipped so
merchants aren't nagged.

**Setup:**
1. Add a `CRON_SECRET` env var in Vercel (any long random string). Vercel
   automatically sends it as `Authorization: Bearer <CRON_SECRET>` on cron calls,
   and the endpoint rejects anything else.
2. Ensure `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (already set for outreach),
   `RESEND_API_KEY` + `RESEND_FROM_EMAIL` (your verified transactional domain),
   and `APP_URL` are set.
3. Deploy — the cron registers automatically. To test now, you can `GET` it with
   the `Authorization: Bearer <CRON_SECRET>` header.

This is transactional mail (a merchant's own account summary), so it correctly
uses your main `RESEND_API_KEY` / domain — *not* the cold-outreach domain.

## Done in this pass

- ✅ Real profile views / saves / actions / conversion + local rank benchmark
- ✅ "What people searched to find you" (search-term attribution on result clicks)
- ✅ "What Gander has driven for you" ROI banner
- ✅ Weekly digest email (above)

## Still worth doing later

- **Search rank / impressions:** also log when a venue *appears* in results (not
  just clicks) to show impression volume and average rank. Higher write volume —
  batch it.
- **True ROI attribution:** tie specific bookings/voucher sales back to the views
  that preceded them, rather than showing totals side by side.
- **Tighten RLS:** restrict `business_events_select` to the venue's owner once
  owner attribution is wired, if you'd rather counts weren't readable by any
  signed-in user.
