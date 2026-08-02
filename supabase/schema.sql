-- =====================================================================
-- MIHAD AI.LIVE — Supabase schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- All tables are protected by Row Level Security: a user can only
-- ever read or write rows that belong to their own auth.uid().
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- users: profile row, mirrors auth.users, created by trigger on signup
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- trigger: auto-create a public.users row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- connected_accounts: a YouTube channel a user has authorized via
-- Google OAuth (stores only encrypted/hashed refresh token reference —
-- actual tokens should live in Supabase Vault or an encrypted column,
-- never in plaintext).
-- ---------------------------------------------------------------------
create table if not exists public.connected_accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  channel_id text not null,
  channel_title text,
  channel_thumbnail text,
  google_account_email text,
  scopes text[] default '{}',
  encrypted_refresh_token text, -- store via Supabase Vault in production
  status text not null default 'active' check (status in ('active', 'error', 'revoked')),
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  unique (user_id, channel_id)
);

alter table public.connected_accounts enable row level security;

create policy "users manage own connected accounts"
  on public.connected_accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- max 20 connected accounts per user, enforced at the database level
create or replace function public.enforce_account_limit()
returns trigger as $$
begin
  if (select count(*) from public.connected_accounts where user_id = new.user_id) >= 20 then
    raise exception 'Maximum of 20 connected YouTube accounts reached';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_account_limit on public.connected_accounts;
create trigger trg_account_limit
  before insert on public.connected_accounts
  for each row execute procedure public.enforce_account_limit();

-- ---------------------------------------------------------------------
-- youtube_channels: cached public channel statistics (from YouTube
-- Data API), refreshed periodically per connected account
-- ---------------------------------------------------------------------
create table if not exists public.youtube_channels (
  id uuid primary key default uuid_generate_v4(),
  connected_account_id uuid not null references public.connected_accounts (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  channel_id text not null,
  subscriber_count bigint default 0,
  view_count bigint default 0,
  video_count bigint default 0,
  is_live boolean default false,
  fetched_at timestamptz not null default now()
);

alter table public.youtube_channels enable row level security;

create policy "users view own channel stats"
  on public.youtube_channels for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- saved_videos: videos/live streams a user has added to Multi Live
-- Monitor or the multi-player grid
-- ---------------------------------------------------------------------
create table if not exists public.saved_videos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  video_id text not null,
  title text,
  thumbnail_url text,
  channel_title text,
  is_live boolean default false,
  added_at timestamptz not null default now()
);

alter table public.saved_videos enable row level security;

create policy "users manage own saved videos"
  on public.saved_videos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- max 20 saved videos per user
create or replace function public.enforce_video_limit()
returns trigger as $$
begin
  if (select count(*) from public.saved_videos where user_id = new.user_id) >= 20 then
    raise exception 'Maximum of 20 monitored videos reached';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_video_limit on public.saved_videos;
create trigger trg_video_limit
  before insert on public.saved_videos
  for each row execute procedure public.enforce_video_limit();

-- ---------------------------------------------------------------------
-- player_settings: persisted layout/state for the multi-player grid
-- ---------------------------------------------------------------------
create table if not exists public.player_settings (
  user_id uuid primary key references public.users (id) on delete cascade,
  layout text not null default '4' check (layout in ('1','2','4','6','9','12','16','20')),
  muted boolean default true,
  updated_at timestamptz not null default now()
);

alter table public.player_settings enable row level security;

create policy "users manage own player settings"
  on public.player_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- analytics_cache: cached YouTube Analytics API responses, keyed by
-- channel + date range, to avoid re-hitting quota on every page load
-- ---------------------------------------------------------------------
create table if not exists public.analytics_cache (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  channel_id text not null,
  range_key text not null, -- e.g. '7d', '28d', '90d', 'today'
  payload jsonb not null default '{}',
  cached_at timestamptz not null default now(),
  unique (user_id, channel_id, range_key)
);

alter table public.analytics_cache enable row level security;

create policy "users manage own analytics cache"
  on public.analytics_cache for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- activity_logs: audit trail of account actions
-- ---------------------------------------------------------------------
create table if not exists public.activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  action text not null, -- login, account_connected, account_disconnected, video_added, player_started, analytics_refreshed
  detail text,
  device text,
  created_at timestamptz not null default now()
);

alter table public.activity_logs enable row level security;

create policy "users view own activity log"
  on public.activity_logs for select
  using (auth.uid() = user_id);

create policy "users insert own activity log"
  on public.activity_logs for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  body text,
  read boolean default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "users manage own notifications"
  on public.notifications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- device_sessions: active device management
-- ---------------------------------------------------------------------
create table if not exists public.device_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  device_label text,
  user_agent text,
  ip_hash text,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.device_sessions enable row level security;

create policy "users manage own device sessions"
  on public.device_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Helpful indexes
-- ---------------------------------------------------------------------
create index if not exists idx_connected_accounts_user on public.connected_accounts (user_id);
create index if not exists idx_youtube_channels_user on public.youtube_channels (user_id);
create index if not exists idx_saved_videos_user on public.saved_videos (user_id);
create index if not exists idx_activity_logs_user_created on public.activity_logs (user_id, created_at desc);
create index if not exists idx_notifications_user_read on public.notifications (user_id, read);
