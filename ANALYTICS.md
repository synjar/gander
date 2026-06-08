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
  created_at  timestamptz not null default now()
);
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

## Natural next steps

- **Search insight:** log a `search_impression` (and the query) when a venue
  appears in results — unlocks "what people searched to find you" and search
  rank, which merchants love. Higher write volume, so batch it.
- **Weekly digest email:** a Monday "Your Gander week: 142 views, 9 calls, 2
  bookings" using the existing email infra — strong for retention.
- **ROI attribution:** tie bookings/voucher revenue to the views that preceded
  them for a true "Gander drove you £X" figure.
- **Tighten RLS:** restrict `business_events_select` to the venue's owner once
  owner attribution is wired, if you'd rather counts weren't world-readable to
  signed-in users.
