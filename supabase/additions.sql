-- ============================================================================
-- Gander — Supabase additions (run AFTER schema.sql)
--
-- Everything added after the original schema: profile columns, referral
-- rewards, business outreach, and merchant analytics. Fully idempotent — safe
-- to run as many times as you like. Paste the whole thing into the Supabase
-- SQL editor and run once.
-- ============================================================================

-- 1) business_profiles: columns the merchant dashboard now saves -------------
--    (missing 'hours' or 'popular_dishes' is what makes "Save changes" fail)
alter table public.business_profiles add column if not exists hours          jsonb;
alter table public.business_profiles add column if not exists popular_dishes jsonb default '[]'::jsonb;

-- 2) Referral rewards (15% off when someone you referred signs up) -----------
create table if not exists public.referral_rewards (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  discount_pct int  not null default 15,
  expires_at   timestamptz not null,
  used         boolean not null default false,
  used_at      timestamptz,
  created_at   timestamptz not null default now()
);
alter table public.referral_rewards enable row level security;
drop policy if exists "rewards_select" on public.referral_rewards;
create policy "rewards_select" on public.referral_rewards for select using (auth.uid() = user_id);
drop policy if exists "rewards_update" on public.referral_rewards;
create policy "rewards_update" on public.referral_rewards for update using (auth.uid() = user_id);

-- Records a referral + rewards the referrer. SECURITY DEFINER so the newly
-- signed-up user's session can write rows for the referrer (bypasses RLS).
create or replace function public.process_referral(p_referrer_id uuid, p_referred_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_referrer_id = p_referred_id then return; end if;
  if exists (select 1 from public.referrals where referred_id = p_referred_id) then return; end if;
  insert into public.referrals (referrer_id, referred_id) values (p_referrer_id, p_referred_id);
  perform public.award_points(p_referrer_id, 100);
  insert into public.referral_rewards (user_id, discount_pct, expires_at)
  values (p_referrer_id, 15, now() + interval '90 days');
end;
$$;
grant execute on function public.process_referral(uuid, uuid) to anon, authenticated;

-- 3) Business outreach (Worthing call/email lists) ---------------------------
alter table public.imported_businesses add column if not exists email text;

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
  status       text not null default 'pending',
  sent_count   int  not null default 0,
  last_sent_at timestamptz,
  created_at   timestamptz not null default now()
);
create table if not exists public.outreach_suppressions (
  email      text primary key,
  reason     text,
  created_at timestamptz not null default now()
);
-- RLS on with NO policies => only the service_role key (used by /api/outreach)
-- can read/write these. The client can never touch them.
alter table public.outreach_leads enable row level security;
alter table public.outreach_suppressions enable row level security;

-- 4) Merchant analytics ------------------------------------------------------
create table if not exists public.business_events (
  id          bigint generated always as identity primary key,
  business_id text not null,
  type        text not null,            -- view|phone|directions|website|menu|share
  query       text,                     -- search term that surfaced the listing
  created_at  timestamptz not null default now()
);
create index if not exists business_events_biz_time_idx
  on public.business_events (business_id, created_at desc);
alter table public.business_events enable row level security;
drop policy if exists "business_events_insert" on public.business_events;
create policy "business_events_insert" on public.business_events
  for insert to anon, authenticated
  with check (type in ('view','phone','directions','website','menu','share'));
drop policy if exists "business_events_select" on public.business_events;
create policy "business_events_select" on public.business_events
  for select to authenticated using (true);

-- Real "saves" count (favourites is RLS-locked to each user, so use a fn)
create or replace function public.business_favourite_count(p_business_id text)
returns integer language sql security definer set search_path = public as $$
  select count(*)::int from public.favourites where business_id = p_business_id;
$$;
grant execute on function public.business_favourite_count(text) to anon, authenticated;

-- 5) Tighten merchant write access -------------------------------------------
-- Previously business_profiles / merchant_stripe_accounts / staff_members were
-- "for all using(true) with check(true)" — anyone (even logged out) could read
-- AND write every row (edit any listing, redirect any payout). Lock WRITES to
-- the venue's owner; keep READS open where the app needs them.
--
-- "Owner" = the user who claimed the matching imported venue. Seed/demo
-- businesses (no imported_businesses row) stay editable so demo mode works.

-- A user may write rows for a business they own, or for a seed/demo business.
create or replace function public.owns_business(p_business_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from public.imported_businesses ib
            where ib.id::text = p_business_id and ib.claimed_by = auth.uid())
    or not exists (select 1 from public.imported_businesses ib
                   where ib.id::text = p_business_id);
$$;
grant execute on function public.owns_business(text) to authenticated;

-- business_profiles: public read, owner-only write
drop policy if exists "Public access to business_profiles" on public.business_profiles;
drop policy if exists "business_profiles_select" on public.business_profiles;
create policy "business_profiles_select" on public.business_profiles for select using (true);
drop policy if exists "business_profiles_write" on public.business_profiles;
create policy "business_profiles_write" on public.business_profiles
  for all to authenticated
  using (public.owns_business(business_id)) with check (public.owns_business(business_id));

-- merchant_stripe_accounts: read open (needed to route the payment split),
-- owner-only write so nobody can redirect a payout
drop policy if exists "Public access to merchant_stripe_accounts" on public.merchant_stripe_accounts;
drop policy if exists "stripe_accounts_select" on public.merchant_stripe_accounts;
create policy "stripe_accounts_select" on public.merchant_stripe_accounts for select using (true);
drop policy if exists "stripe_accounts_write" on public.merchant_stripe_accounts;
create policy "stripe_accounts_write" on public.merchant_stripe_accounts
  for all to authenticated
  using (public.owns_business(business_id)) with check (public.owns_business(business_id));

-- staff_members: read open, owner-only write
drop policy if exists "Public access to staff_members" on public.staff_members;
drop policy if exists "staff_select" on public.staff_members;
create policy "staff_select" on public.staff_members for select using (true);
drop policy if exists "staff_write" on public.staff_members;
create policy "staff_write" on public.staff_members
  for all to authenticated
  using (public.owns_business(business_id)) with check (public.owns_business(business_id));

-- imported_businesses: allow claiming an unclaimed venue and editing your own,
-- but stop anyone from stealing a venue already claimed by someone else.
-- (Imports only touch unclaimed venues, so claimed_by stays null there.)
drop policy if exists "Owners can claim businesses" on public.imported_businesses;
create policy "Owners can claim businesses" on public.imported_businesses
  for update to authenticated
  using (claimed_by is null or claimed_by = auth.uid())
  with check (claimed_by is null or claimed_by = auth.uid());

-- 6) Booking availability ----------------------------------------------------
-- Per-venue booking settings (slots, max party, daily capacity).
alter table public.business_profiles add column if not exists booking_settings jsonb;

-- Confirmed bookings for a venue on a date (capacity check). SECURITY DEFINER
-- because the bookings table is RLS-locked to each user's own rows.
create or replace function public.bookings_count_on_date(p_business_id text, p_date date)
returns integer language sql security definer set search_path = public as $$
  select count(*)::int from public.bookings
  where business_id = p_business_id and date = p_date and status = 'confirmed';
$$;
grant execute on function public.bookings_count_on_date(text, date) to anon, authenticated;

-- 7) Commission model: free first month, then 12% ----------------------------
-- Stamp when a venue was claimed so the payment API can give the owner a
-- commission-free first month before the 12% platform fee kicks in.
alter table public.imported_businesses add column if not exists claimed_at timestamptz;
