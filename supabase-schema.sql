-- ============================================================
-- Operation Meal Forward — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Users table
create table if not exists public.users (
  id           uuid primary key default gen_random_uuid(),
  email        text unique not null,
  first_name   text not null default '',
  last_name    text not null default '',
  phone_number text,
  created_at   timestamptz not null default now()
);

-- Migrations: add new columns to existing tables
alter table public.users add column if not exists phone_number text;
alter table public.users add column if not exists last_name text not null default '';

-- OTP codes table (for email verification)
create table if not exists public.otp_codes (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  code        text not null,
  expires_at  timestamptz not null,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Events table
create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid not null references public.users(id) on delete cascade,
  date          date not null,
  time          time not null,
  location      text not null,
  total_swipes  integer not null check (total_swipes > 0),
  phone_number  text not null,
  created_at    timestamptz not null default now()
);

-- Joins table
create table if not exists public.joins (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  unique(event_id, user_id)
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.users      enable row level security;
alter table public.otp_codes  enable row level security;
alter table public.events     enable row level security;
alter table public.joins      enable row level security;

-- Allow full access via service role (used in API routes with anon key for now)
-- In production you'd use the service role key on the server only

create policy "Allow all on users"     on public.users     for all using (true) with check (true);
create policy "Allow all on otp_codes" on public.otp_codes for all using (true) with check (true);
create policy "Allow all on events"    on public.events    for all using (true) with check (true);
create policy "Allow all on joins"     on public.joins     for all using (true) with check (true);
