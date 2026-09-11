-- ============================================================
-- ตัวช่วยฉีดอินซูลิน — Database schema for Supabase (Postgres)
-- Run this once in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1) Profile data (one row per signed-up user)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  age int,
  years_diagnosed int,
  ic_ratio numeric,        -- 1 unit covers this many grams of carbohydrate
  isf numeric,             -- correction factor: 1 unit lowers blood glucose by this many mg/dl
  target_bg numeric,       -- pre-meal target blood glucose, mg/dl
  low_bg numeric default 70, -- threshold below which the app blocks correction dosing
  pen_increment numeric default 1, -- 1 or 0.5 units, matches the person's pen
  consent_given_at timestamptz,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2) Dose history log (many rows per user)
create table if not exists public.dose_logs (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  carbs numeric,
  blood_glucose numeric,
  carb_dose numeric,
  correction_dose numeric,
  total_dose numeric,
  note text
);

alter table public.dose_logs enable row level security;

create policy "Users can view their own dose logs"
  on public.dose_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own dose logs"
  on public.dose_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own dose logs"
  on public.dose_logs for delete
  using (auth.uid() = user_id);

-- Done. No manual data needed — rows are created automatically as people
-- sign up and use the app.
