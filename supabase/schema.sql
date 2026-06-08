-- ============================================================================
-- Gander — Supabase schema
-- Paste this into the Supabase SQL editor (Database → SQL editor → New query)
-- and run it once to set up the backend. Safe to re-run.
-- ============================================================================

-- Profiles -------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default 'Guest',
  avatar text,
  level int not null default 1,
  points int not null default 0,
  neighbourhood text,
  bio text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Create a profile automatically when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Reviews --------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id text not null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  food int, service int, ambience int, value int,
  title text,
  body text not null,
  photos text[] not null default '{}',
  visit_type text,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "Reviews are viewable by everyone" on public.reviews;
create policy "Reviews are viewable by everyone"
  on public.reviews for select using (true);

drop policy if exists "Users manage own reviews" on public.reviews;
create policy "Users manage own reviews"
  on public.reviews for all using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- Favourites -----------------------------------------------------------------
create table if not exists public.favourites (
  user_id uuid not null references auth.users on delete cascade,
  business_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, business_id)
);

alter table public.favourites enable row level security;

drop policy if exists "Users manage own favourites" on public.favourites;
create policy "Users manage own favourites"
  on public.favourites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bookings -------------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  business_id text not null,
  business_name text not null,
  date date not null,
  "time" text not null,
  party_size int not null,
  occasion text,
  status text not null default 'confirmed',
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

drop policy if exists "Users manage own bookings" on public.bookings;
create policy "Users manage own bookings"
  on public.bookings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Vouchers -------------------------------------------------------------------
create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  deal_id text not null,
  business_id text not null,
  business_name text not null,
  title text not null,
  deal_price numeric not null,
  code text not null,
  redeemed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.vouchers enable row level security;

drop policy if exists "Users manage own vouchers" on public.vouchers;
create policy "Users manage own vouchers"
  on public.vouchers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Merchant: owner responses to reviews --------------------------------------
create table if not exists public.review_responses (
  review_id uuid primary key references public.reviews on delete cascade,
  owner_id uuid not null references auth.users on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.review_responses enable row level security;

drop policy if exists "Responses are viewable by everyone" on public.review_responses;
create policy "Responses are viewable by everyone"
  on public.review_responses for select using (true);

drop policy if exists "Owners manage own responses" on public.review_responses;
create policy "Owners manage own responses"
  on public.review_responses for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Merchant: deals created by owners -----------------------------------------
create table if not exists public.merchant_deals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  business_id text not null,
  title text not null,
  description text,
  original_price numeric not null,
  deal_price numeric not null,
  tag text,
  sold int not null default 0,
  image text,
  expires text,
  created_at timestamptz not null default now()
);

alter table public.merchant_deals enable row level security;

drop policy if exists "Merchant deals are viewable by everyone" on public.merchant_deals;
create policy "Merchant deals are viewable by everyone"
  on public.merchant_deals for select using (true);

drop policy if exists "Owners manage own deals" on public.merchant_deals;
create policy "Owners manage own deals"
  on public.merchant_deals for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Realtime -------------------------------------------------------------------
-- Broadcast changes so reviews, deals and owner responses appear live.
do $$ begin
  alter publication supabase_realtime add table public.reviews;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.merchant_deals;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.review_responses;
exception when duplicate_object then null; end $$;

-- Storage: public 'photos' bucket for review & venue images ------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "Public read photos" on storage.objects;
create policy "Public read photos"
  on storage.objects for select using (bucket_id = 'photos');

drop policy if exists "Authenticated upload photos" on storage.objects;
create policy "Authenticated upload photos"
  on storage.objects for insert to authenticated with check (bucket_id = 'photos');

-- Business submissions -------------------------------------------------------
create table if not exists public.business_submissions (
  id uuid primary key default gen_random_uuid(),
  submitter_id uuid references auth.users on delete set null,
  submitter_email text not null,
  name text not null,
  slug text not null,
  category text not null,
  city text not null,
  city_id text not null,
  neighbourhood text not null,
  address text not null,
  postcode text not null,
  short_description text not null default '',
  description text not null,
  phone text not null default '',
  website text not null default '',
  price_level int not null default 2,
  bookable boolean not null default false,
  delivers boolean not null default false,
  status text not null default 'pending',
  reviewer_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.business_submissions enable row level security;

drop policy if exists "Anyone can submit a business" on public.business_submissions;
create policy "Anyone can submit a business"
  on public.business_submissions for insert with check (true);

drop policy if exists "Authenticated users can read submissions" on public.business_submissions;
create policy "Authenticated users can read submissions"
  on public.business_submissions for select to authenticated using (true);

drop policy if exists "Authenticated users can update submissions" on public.business_submissions;
create policy "Authenticated users can update submissions"
  on public.business_submissions for update to authenticated using (true);

-- Staff members --------------------------------------------------------------
create table if not exists public.staff_members (
  id           uuid primary key default gen_random_uuid(),
  business_id  text not null,
  business_name text not null,
  invited_by   uuid references auth.users(id) on delete set null,
  email        text not null,
  name         text not null default '',
  created_at   timestamptz not null default now(),
  unique (business_id, email)
);

alter table public.staff_members enable row level security;

drop policy if exists "Public access to staff_members" on public.staff_members;
create policy "Public access to staff_members"
  on public.staff_members for all using (true) with check (true);

-- Merchant Stripe Connect accounts ------------------------------------------
create table if not exists public.merchant_stripe_accounts (
  id                uuid primary key default gen_random_uuid(),
  business_id       text not null unique,
  stripe_account_id text not null,
  connected_at      timestamptz not null default now()
);

alter table public.merchant_stripe_accounts enable row level security;

drop policy if exists "Public access to merchant_stripe_accounts" on public.merchant_stripe_accounts;
create policy "Public access to merchant_stripe_accounts"
  on public.merchant_stripe_accounts for all using (true) with check (true);

-- Business profiles (owner-editable listing details + photos) ----------------
create table if not exists public.business_profiles (
  business_id       text primary key,
  name              text,
  short_description text,
  description       text,
  phone             text,
  website           text,
  address           text,
  postcode          text,
  hero_image_url    text,
  gallery_urls      text[]  default '{}',
  amenities         text[]  default '{}',
  updated_at        timestamptz default now()
);

alter table public.business_profiles enable row level security;

drop policy if exists "Public access to business_profiles" on public.business_profiles;
create policy "Public access to business_profiles"
  on public.business_profiles for all using (true) with check (true);

-- Add hours column to business_profiles (run if table already exists) --------
alter table public.business_profiles add column if not exists hours jsonb;

-- Bookings: allow merchants to read all bookings for their business ----------
-- The existing "Users manage own bookings" policy covers insert/update/delete
-- for the booking owner. We add a broader select so merchants can see them.
drop policy if exists "Merchants can read business bookings" on public.bookings;
create policy "Merchants can read business bookings"
  on public.bookings for select using (true);

-- Merchants also need to be able to update status (confirm/cancel)
drop policy if exists "Merchants can update booking status" on public.bookings;
create policy "Merchants can update booking status"
  on public.bookings for update using (true) with check (true);

-- Notifications table --------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text,
  link        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Users manage own notifications" on public.notifications;
create policy "Users manage own notifications"
  on public.notifications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Allow the system/service to insert notifications for any user
-- (used by notifyBusinessOwner which runs with anon key from frontend)
drop policy if exists "Anyone can create notifications" on public.notifications;
create policy "Anyone can create notifications"
  on public.notifications for insert with check (true);

-- Realtime: broadcast notification inserts so the bell updates live
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;

-- Check-ins ------------------------------------------------------------------
create table if not exists public.check_ins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  business_id text not null,
  created_at  timestamptz not null default now()
);

alter table public.check_ins enable row level security;

drop policy if exists "Users manage own check_ins" on public.check_ins;
create policy "Users manage own check_ins"
  on public.check_ins for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Anyone can read check-in counts (for display on business pages)
drop policy if exists "Anyone can read check_ins" on public.check_ins;
create policy "Anyone can read check_ins"
  on public.check_ins for select using (true);

-- Follows --------------------------------------------------------------------
create table if not exists public.follows (
  follower_id  uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id)
);

alter table public.follows enable row level security;

drop policy if exists "Users manage own follows" on public.follows;
create policy "Users manage own follows"
  on public.follows for all
  using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

drop policy if exists "Anyone can read follows" on public.follows;
create policy "Anyone can read follows"
  on public.follows for select using (true);

-- Referrals ------------------------------------------------------------------
create table if not exists public.referrals (
  id           uuid primary key default gen_random_uuid(),
  referrer_id  uuid not null references auth.users(id) on delete cascade,
  referred_id  uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (referred_id) -- each user can only be referred once
);

alter table public.referrals enable row level security;

drop policy if exists "Public access to referrals" on public.referrals;
create policy "Public access to referrals"
  on public.referrals for all using (true) with check (true);

-- Imported businesses (OpenStreetMap) ----------------------------------------
-- Stub listings imported from OSM. Owners can claim them to unlock the full
-- merchant dashboard, add photos, and respond to reviews.
create table if not exists public.imported_businesses (
  id            uuid primary key default gen_random_uuid(),
  osm_id        text not null unique,        -- e.g. "node/123456"
  name          text not null,
  slug          text not null,
  category      text not null,
  cuisine       text,
  neighbourhood text not null default '',
  city          text not null,
  city_id       text not null,
  address       text not null default '',
  postcode      text not null default '',
  phone         text not null default '',
  website       text not null default '',
  lat           double precision,
  lng           double precision,
  hours         jsonb,
  tags          jsonb,
  bookable      boolean not null default false,
  delivers      boolean not null default false,
  price_level   int not null default 2,
  status        text not null default 'active', -- active | removed
  claimed       boolean not null default false,
  claimed_by    uuid references auth.users on delete set null,
  imported_at   timestamptz not null default now()
);

alter table public.imported_businesses enable row level security;

-- Anyone can read active listings
drop policy if exists "Imported businesses are public" on public.imported_businesses;
create policy "Imported businesses are public"
  on public.imported_businesses for select using (status = 'active');

-- Authenticated users (admins / owners) can insert / update
drop policy if exists "Authenticated users can import businesses" on public.imported_businesses;
create policy "Authenticated users can import businesses"
  on public.imported_businesses for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Owners can claim businesses" on public.imported_businesses;
create policy "Owners can claim businesses"
  on public.imported_businesses for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- XP: award_points RPC -------------------------------------------------------
-- Atomically increments a user's points and updates their level.
-- Level thresholds: 1=0, 2=100, 3=300, 4=700, 5=1500
create or replace function public.award_points(p_user_id uuid, p_amount int)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_new_points int;
  v_new_level int;
begin
  update profiles
    set points = points + p_amount
    where id = p_user_id
    returning points into v_new_points;

  -- Derive level from new points total
  v_new_level := case
    when v_new_points >= 1500 then 5
    when v_new_points >= 700  then 4
    when v_new_points >= 300  then 3
    when v_new_points >= 100  then 2
    else 1
  end;

  update profiles
    set level = v_new_level
    where id = p_user_id;
end;
$$;
