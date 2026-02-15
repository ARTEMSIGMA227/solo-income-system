-- ============================================
-- Solo Income System — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Охотник',
  timezone text not null default 'Europe/Berlin',
  daily_income_target integer not null default 5000,
  monthly_income_target integer not null default 150000,
  daily_actions_target integer not null default 30,
  penalty_xp integer not null default 100,
  streak_current integer not null default 0,
  streak_best integer not null default 0,
  consecutive_misses integer not null default 0,
  focus_duration_minutes integer not null default 90,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- STATS
-- ============================================
create table if not exists public.stats (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  level integer not null default 1,
  current_xp integer not null default 0,
  total_xp_earned integer not null default 0,
  total_xp_lost integer not null default 0,
  total_sales integer not null default 0,
  total_clients integer not null default 0,
  total_income numeric not null default 0,
  total_actions integer not null default 0,
  gold integer not null default 0,
  total_gold_earned integer not null default 0,
  total_gold_spent integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- CHARACTER CONFIG
-- ============================================
create table if not exists public.character_config (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  use_custom_image boolean not null default false,
  custom_image_url text,
  body_type text not null default 'male_1',
  skin_color text not null default '#f5d0a9',
  hair_style text not null default 'spiky',
  hair_color text not null default '#1a1a2e',
  eye_color text not null default '#3b82f6',
  outfit_color text not null default '#7c3aed',
  level_images jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- QUESTS
-- ============================================
create table if not exists public.quests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  quest_type text not null default 'daily_optional'
    check (quest_type in ('daily_mandatory', 'daily_optional', 'weekly', 'custom')),
  category text not null default 'other'
    check (category in ('income_action', 'strategy', 'skill', 'fitness', 'other')),
  xp_reward integer not null default 25,
  is_template boolean not null default false,
  target_count integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_quests_user on public.quests(user_id);

-- ============================================
-- HABITS
-- ============================================
create table if not exists public.habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'other'
    check (category in ('income_action', 'strategy', 'skill', 'fitness', 'other')),
  frequency text not null default 'daily'
    check (frequency in ('daily', 'weekday', 'weekly')),
  xp_reward integer not null default 10,
  streak_current integer not null default 0,
  streak_best integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_habits_user on public.habits(user_id);

-- ============================================
-- COMPLETIONS
-- ============================================
create table if not exists public.completions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid references public.quests(id) on delete set null,
  habit_id uuid references public.habits(id) on delete set null,
  completion_date date not null default current_date,
  count_done integer not null default 1,
  notes text,
  created_at timestamptz not null default now(),
  synced boolean not null default true,
  offline_id text
);

create index if not exists idx_completions_user_date on public.completions(user_id, completion_date);

-- ============================================
-- XP EVENTS
-- ============================================
create table if not exists public.xp_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  xp_amount integer not null default 0,
  multiplier numeric not null default 1.0,
  description text,
  reference_id uuid,
  event_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_xp_events_user_date on public.xp_events(user_id, event_date);
create index if not exists idx_xp_events_user_type_date on public.xp_events(user_id, event_type, event_date);

-- ============================================
-- INCOME EVENTS
-- ============================================
create table if not exists public.income_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null default 0,
  source text not null default 'other'
    check (source in ('sale', 'contract', 'freelance', 'bonus', 'other')),
  client_name text,
  description text,
  event_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_income_events_user_date on public.income_events(user_id, event_date);

-- ============================================
-- BOSSES
-- ============================================
create table if not exists public.bosses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  boss_type text not null default 'weekly'
    check (boss_type in ('weekly', 'monthly')),
  description text,
  requirements jsonb not null default '[]',
  xp_reward integer not null default 500,
  is_defeated boolean not null default false,
  deadline date not null,
  defeated_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_bosses_user on public.bosses(user_id);

-- ============================================
-- PERK UNLOCKS
-- ============================================
create table if not exists public.perk_unlocks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  perk_key text not null,
  unlocked_at_level integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id, perk_key)
);

-- ============================================
-- DAILY SUMMARIES
-- ============================================
create table if not exists public.daily_summaries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  summary_date date not null,
  total_actions integer not null default 0,
  mandatory_completed boolean not null default false,
  xp_earned integer not null default 0,
  xp_lost integer not null default 0,
  income_today numeric not null default 0,
  status text not null default 'pending'
    check (status in ('green', 'yellow', 'red', 'pending')),
  multiplier_applied numeric not null default 1.0,
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, summary_date)
);

-- ============================================
-- SHOP ITEMS (reference table)
-- ============================================
create table if not exists public.shop_items (
  id uuid primary key default uuid_generate_v4(),
  item_key text not null unique,
  name text not null,
  description text not null default '',
  category text not null default 'potion'
    check (category in ('potion', 'artifact', 'scroll')),
  price integer not null default 100,
  icon text not null default '📦',
  effect_type text not null default 'none',
  effect_value numeric not null default 0,
  duration_hours integer,
  max_stack integer not null default 99,
  min_level integer not null default 1,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================
-- INVENTORY
-- ============================================
create table if not exists public.inventory (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null,
  quantity integer not null default 1,
  is_active boolean not null default false,
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, item_key)
);

-- ============================================
-- GOLD EVENTS
-- ============================================
create table if not exists public.gold_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null default 0,
  event_type text not null,
  description text,
  event_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_gold_events_user on public.gold_events(user_id, event_date);

-- ============================================
-- ACHIEVEMENTS
-- ============================================
create table if not exists public.achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz not null default now(),
  unique(user_id, achievement_key)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.stats enable row level security;
alter table public.character_config enable row level security;
alter table public.quests enable row level security;
alter table public.habits enable row level security;
alter table public.completions enable row level security;
alter table public.xp_events enable row level security;
alter table public.income_events enable row level security;
alter table public.bosses enable row level security;
alter table public.perk_unlocks enable row level security;
alter table public.daily_summaries enable row level security;
alter table public.shop_items enable row level security;
alter table public.inventory enable row level security;
alter table public.gold_events enable row level security;
alter table public.achievements enable row level security;

-- Profiles: users can only access their own
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Stats: users can only access their own
create policy "stats_select_own" on public.stats for select using (auth.uid() = user_id);
create policy "stats_insert_own" on public.stats for insert with check (auth.uid() = user_id);
create policy "stats_update_own" on public.stats for update using (auth.uid() = user_id);

-- Character config
create policy "cc_select_own" on public.character_config for select using (auth.uid() = user_id);
create policy "cc_insert_own" on public.character_config for insert with check (auth.uid() = user_id);
create policy "cc_update_own" on public.character_config for update using (auth.uid() = user_id);

-- Quests
create policy "quests_select_own" on public.quests for select using (auth.uid() = user_id);
create policy "quests_insert_own" on public.quests for insert with check (auth.uid() = user_id);
create policy "quests_update_own" on public.quests for update using (auth.uid() = user_id);
create policy "quests_delete_own" on public.quests for delete using (auth.uid() = user_id);

-- Habits
create policy "habits_select_own" on public.habits for select using (auth.uid() = user_id);
create policy "habits_insert_own" on public.habits for insert with check (auth.uid() = user_id);
create policy "habits_update_own" on public.habits for update using (auth.uid() = user_id);
create policy "habits_delete_own" on public.habits for delete using (auth.uid() = user_id);

-- Completions
create policy "completions_select_own" on public.completions for select using (auth.uid() = user_id);
create policy "completions_insert_own" on public.completions for insert with check (auth.uid() = user_id);
create policy "completions_update_own" on public.completions for update using (auth.uid() = user_id);

-- XP Events
create policy "xp_select_own" on public.xp_events for select using (auth.uid() = user_id);
create policy "xp_insert_own" on public.xp_events for insert with check (auth.uid() = user_id);

-- Income Events
create policy "income_select_own" on public.income_events for select using (auth.uid() = user_id);
create policy "income_insert_own" on public.income_events for insert with check (auth.uid() = user_id);

-- Bosses
create policy "bosses_select_own" on public.bosses for select using (auth.uid() = user_id);
create policy "bosses_insert_own" on public.bosses for insert with check (auth.uid() = user_id);
create policy "bosses_update_own" on public.bosses for update using (auth.uid() = user_id);

-- Perk Unlocks
create policy "perks_select_own" on public.perk_unlocks for select using (auth.uid() = user_id);
create policy "perks_insert_own" on public.perk_unlocks for insert with check (auth.uid() = user_id);
create policy "perks_update_own" on public.perk_unlocks for update using (auth.uid() = user_id);

-- Daily Summaries
create policy "summaries_select_own" on public.daily_summaries for select using (auth.uid() = user_id);
create policy "summaries_insert_own" on public.daily_summaries for insert with check (auth.uid() = user_id);
create policy "summaries_update_own" on public.daily_summaries for update using (auth.uid() = user_id);

-- Shop Items: readable by all authenticated users
create policy "shop_select_all" on public.shop_items for select using (auth.role() = 'authenticated');

-- Inventory
create policy "inventory_select_own" on public.inventory for select using (auth.uid() = user_id);
create policy "inventory_insert_own" on public.inventory for insert with check (auth.uid() = user_id);
create policy "inventory_update_own" on public.inventory for update using (auth.uid() = user_id);

-- Gold Events
create policy "gold_select_own" on public.gold_events for select using (auth.uid() = user_id);
create policy "gold_insert_own" on public.gold_events for insert with check (auth.uid() = user_id);

-- Achievements
create policy "achievements_select_own" on public.achievements for select using (auth.uid() = user_id);
create policy "achievements_insert_own" on public.achievements for insert with check (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Auto-create profile + stats on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'Охотник')
  );

  insert into public.stats (user_id)
  values (new.id);

  return new;
end;
$$;

-- Drop if exists to avoid duplicate
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- SEED: Default shop items
-- ============================================
insert into public.shop_items (item_key, name, description, category, price, icon, effect_type, effect_value, duration_hours, min_level) values
  ('xp_potion_small', 'Малое зелье XP', '+25% XP на 2 часа', 'potion', 50, '🧪', 'xp_boost', 1.25, 2, 1),
  ('xp_potion_large', 'Большое зелье XP', '+50% XP на 1 час', 'potion', 150, '⚗️', 'xp_boost', 1.5, 1, 5),
  ('shield_scroll', 'Свиток защиты', 'Отмена 1 штрафа за пропуск', 'scroll', 200, '📜', 'penalty_shield', 1, null, 3),
  ('gold_amulet', 'Золотой амулет', '+50% золота на 4 часа', 'artifact', 100, '📿', 'gold_boost', 1.5, 4, 1),
  ('streak_restore', 'Камень воскрешения', 'Восстановить серию при пропуске', 'artifact', 500, '💎', 'streak_restore', 1, null, 10),
  ('double_xp', 'Свиток двойного XP', 'x2 XP на 30 минут', 'scroll', 300, '✨', 'xp_boost', 2.0, 0, 8)
on conflict (item_key) do nothing;

-- ============================================
-- STORAGE: Create avatars bucket
-- ============================================
-- Run separately in Supabase Dashboard > Storage:
-- Create bucket "avatars" with public access
-- Or via SQL:
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policy: users can upload to their own folder
create policy "avatars_upload_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_select_public" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
