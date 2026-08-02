# MIHAD AI.LIVE

**Multi-Channel YouTube Live Monitor & Analytics Dashboard**

A premium, mobile-first dashboard for monitoring multiple YouTube channels and live
streams side by side, with real analytics pulled from Google's own APIs. This project
displays only public YouTube data and data a user has explicitly authorized via Google
OAuth — it does not generate views, watch time, or engagement of any kind.

## Tech stack

- **Frontend:** Next.js (Pages Router) + React + Tailwind CSS
- **Backend:** Vercel Serverless API Routes (`pages/api/*`)
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Supabase Auth)
- **APIs:** Google OAuth 2.0, YouTube Data API v3, YouTube Analytics API
- **Deployment:** GitHub → Vercel

## Project structure

```
mihad-ai-live/
├── components/          UI components (Sidebar, Topbar, cards, charts, player grid)
├── lib/                 Supabase clients + YouTube API helpers (server-only)
├── pages/
│   ├── api/
│   │   ├── accounts/    connect / disconnect / refresh a connected YouTube account
│   │   └── youtube/     video metadata, channel stats, analytics (all server-side)
│   ├── index.js         public landing page
│   ├── login.js         "Continue with Google" sign-in
│   ├── dashboard.js      overview cards, recent activity
│   ├── accounts.js       connected YouTube accounts (10–20)
│   ├── live-monitor.js   add up to 20 video/live URLs
│   ├── player.js         multi-player grid (1–20 layouts) with master controls
│   ├── analytics.js      charts + date-range filters
│   ├── activity.js       activity/audit log
│   └── settings.js       account info + active device management
├── supabase/schema.sql   full DB schema, RLS policies, triggers
├── middleware.js         edge auth guard for protected routes
└── .env.example
```

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/schema.sql`. This creates every table
   (`users`, `connected_accounts`, `youtube_channels`, `saved_videos`,
   `player_settings`, `analytics_cache`, `activity_logs`, `notifications`,
   `device_sessions`), enables Row Level Security on all of them, and adds
   the triggers that auto-create a profile row on signup and cap accounts
   at 20 per user.
3. Under **Authentication → Providers**, enable **Google** and paste in
   your Google OAuth Client ID/Secret (see step 2).
4. Under **Authentication → URL Configuration**, add your site URL and
   `/accounts` and `/dashboard` as allowed redirect URLs.

## 2. Create the Google OAuth client

1. In [Google Cloud Console](https://console.cloud.google.com), create a
   project and enable **YouTube Data API v3** and **YouTube Analytics API**.
2. Create an OAuth 2.0 Client ID (Web application).
3. Add your Supabase project's callback URL as an authorized redirect URI:
   `https://<your-project>.supabase.co/auth/v1/callback`
4. Add these scopes to the consent screen:
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/yt-analytics.readonly`
5. Get a server-side **API key** as well (separate from the OAuth client)
   for public metadata lookups — restrict it to YouTube Data API v3.

## 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
YOUTUBE_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` and `GOOGLE_CLIENT_SECRET` are **server-only** —
never prefix them with `NEXT_PUBLIC_` and never reference them from a
client component.

## 4. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## 5. Deploy

See `DEPLOYMENT.md`.

## Security notes

- Every table has Row Level Security scoped to `auth.uid()` — a user can
  only ever read or write their own rows.
- Google refresh tokens are stored server-side only (`encrypted_refresh_token`
  column) and should be encrypted via [Supabase Vault](https://supabase.com/docs/guides/database/vault)
  in production, not stored in plaintext.
- All YouTube API calls happen in `pages/api/*` — the browser never sees
  `YOUTUBE_API_KEY`, `GOOGLE_CLIENT_SECRET`, or the Supabase service role key.
- The multi-player grid uses only the official YouTube iframe embed. Master
  controls (Play All / Pause All / Mute / Unmute) send the same postMessage
  commands a manual click on each player would send — nothing autoplays on
  page load and nothing runs hidden.

## What's intentionally left as a TODO

- **Token refresh exchange**: `pages/api/youtube/analytics.js` expects a
  live Google access token (see the `x-yt-access-token` header check).
  Wire this to a proper server-side refresh-token exchange (e.g. a
  Supabase Edge Function backed by Vault) before going to production.
- **Scheduled sync**: connected-account stats currently refresh on demand
  (the "Refresh" button). For automatic background sync, add a Vercel Cron
  job that calls the admin Supabase client (`lib/supabaseServer.js →
  getAdminSupabase`) on a schedule.
- **Device session writes**: `device_sessions` rows are read in
  `pages/settings.js` but need a small hook (e.g. in `middleware.js` or on
  login) to actually insert/update a row per device — left open since the
  exact device-fingerprinting approach is a product decision.
