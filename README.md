# Gander

**Gander** is a Dianping-style local discovery app for England — *have a gander* at
the best restaurants, cafés, bars and local spots, read trusted reviews, grab a deal,
book a table and order in. It ships as a polished prototype that runs entirely in the
browser (**demo mode**), and can be switched to a **real backend** (Supabase) by
adding two environment variables.

## Features

**For diners**
- **Multiple regions** — switch between London, Bournemouth, Southampton and West
  Sussex; discovery, search, deals and the map all follow your chosen city.
- **Discover** — hero search, category tiles, *Gander Picks*, the *Must-Eat List*,
  trending venues, featured deals and neighbourhood guides.
- **Search & filters** — keyword, category, neighbourhood, price and rating, with a live
  interactive map (Leaflet + OpenStreetMap) and per-venue maps on listings.
- **Business pages** — gallery, rating breakdown, reviews, popular dishes, hours, amenities.
- **Reviews** — star sub-scores, visit type, real photo uploads and helpful votes.
- **Deals & vouchers** — buy a prepaid voucher with a test-mode card checkout (no real charge).
- **Booking & delivery** — reserve a table/class/treatment, or order from a basket.
- **Social** — community feed, likes, top-reviewer leaderboard.
- **Profile & accounts** — sign in, level/points, your reviews, saved places, bookings, wallet.

**For businesses** (`/business`)
- A *Gander for Business* landing page and an **owner dashboard** (`/business/dashboard`).
- Live stats, a **reviews inbox** to publicly respond to customers, and a tool to
  **create deals** that appear across Gander instantly.

**Operations** (`/admin`)
- An **admin console** with platform stats, charts (venues by city/category, ratings)
  and **moderation** — hide a review or a whole venue and it drops out of discovery.

## Tech stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com) · [React Router v7](https://reactrouter.com) · [lucide-react](https://lucide.dev)
- [Supabase](https://supabase.com) for optional real auth + Postgres (`@supabase/supabase-js`)
- [Leaflet](https://leafletjs.com) + OpenStreetMap / CARTO tiles for interactive maps (no API key)
- A `localStorage`-backed store for instant, offline-friendly demo state

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run preview  # preview the production build
```

Out of the box the app runs in **demo mode**: everything works in the browser with a
guest account and seeded London data — no setup required.

## Switching on the real backend (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project, open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql) and **Run** it. This creates the
   tables (profiles, reviews, favourites, bookings, vouchers, merchant deals &
   responses) with row-level security.
3. Open **Project Settings → API** and copy your **Project URL** and **anon public key**.
4. Copy `.env.example` to `.env` and paste them in:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```
5. Restart `npm run dev`. A **Sign in** button appears in the header — create an
   account and you're on real auth. (For quick testing, you can disable email
   confirmation under **Authentication → Providers → Email**.)

Once configured **and signed in**, the store automatically reads and writes favourites,
bookings, vouchers, reviews, owner responses and merchant deals through Supabase (via the
typed layer in [`src/lib/db.ts`](src/lib/db.ts)). Signed out or unconfigured, it falls back
to the in-browser demo store — so the app always runs.

With Supabase connected you also get **real photo uploads** (to a public `photos` Storage
bucket) and **realtime updates** — new reviews, deals and owner responses appear live via
Supabase channels. Running `schema.sql` also creates the Storage bucket and enables realtime.

## Project structure

```
src/
  data/         # types + seeded London dataset (businesses, reviews, deals, users, feed)
  lib/          # img + format helpers, supabase client, db.ts data-access layer
  auth/         # AuthContext — Supabase auth with a demo/guest fallback
  store/        # localStorage-backed React context (reviews, favourites, bookings, …)
  components/   # reusable UI (cards, header, modals, stars, auth modal, …)
  pages/        # Home, Search, BusinessDetail, Deals, DealDetail, Feed, Profile,
                # BusinessLanding, MerchantDashboard
supabase/
  schema.sql    # database schema + row-level security policies
```

## Notes

- **Sample data only.** Venue photos come from [loremflickr](https://loremflickr.com)
  (keyword-matched) with a generated gradient fallback — see `src/lib/img.ts`.
- **Renaming** the app is one line: `APP` in `src/data/index.ts`.
- Booking, delivery and voucher purchases are mocked end to end (no payments).

## Possible next steps

- Image uploads to Supabase Storage (replacing the sample photos).
- Realtime updates (Supabase channels) so new reviews and deals appear live.
- Add more English cities and regions — the city model in `src/data/cities.ts` makes
  this largely a data-only change.
```
