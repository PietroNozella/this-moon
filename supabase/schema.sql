create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  native_language text default 'pt-BR',
  target_language text default 'en',
  current_level text default 'beginner',
  main_goal text,
  daily_minutes_goal integer default 15,
  interests text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.learning_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  original_phrase text not null,
  translation text,
  meaning_explanation text,
  source_type text not null,
  source_title text,
  source_url text,
  context_note text,
  difficulty text default 'unknown',
  status text default 'new',
  favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid references public.learning_entries(id) on delete set null,
  chunk_text text not null,
  natural_version text,
  casual_version text,
  translation text,
  usage_note text,
  pronunciation_note text,
  status text default 'new',
  usage_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.personal_sentences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid references public.learning_entries(id) on delete cascade,
  chunk_id uuid references public.chunks(id) on delete set null,
  sentence text not null,
  corrected_sentence text,
  natural_sentence text,
  translation text,
  ai_feedback text,
  status text default 'created',
  favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz default now(),
  unique(user_id, name)
);

create table if not exists public.entry_tags (
  entry_id uuid references public.learning_entries(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (entry_id, tag_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid references public.learning_entries(id) on delete cascade,
  chunk_id uuid references public.chunks(id) on delete cascade,
  review_type text not null,
  prompt text,
  expected_answer text,
  last_answer text,
  rating text,
  ease_factor numeric default 2.5,
  interval_days integer default 0,
  due_at timestamptz default now(),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null,
  source_type text,
  duration_seconds integer default 0,
  entries_practiced integer default 0,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.practice_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.practice_sessions(id) on delete cascade,
  entry_id uuid references public.learning_entries(id) on delete set null,
  chunk_id uuid references public.chunks(id) on delete set null,
  prompt text,
  answer text,
  corrected_answer text,
  feedback text,
  rating text,
  created_at timestamptz default now()
);

create table if not exists public.audio_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid references public.learning_entries(id) on delete set null,
  chunk_id uuid references public.chunks(id) on delete set null,
  sentence_id uuid references public.personal_sentences(id) on delete set null,
  storage_path text not null,
  transcript text,
  self_rating text,
  ai_feedback text,
  created_at timestamptz default now()
);

create table if not exists public.ai_feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid references public.learning_entries(id) on delete cascade,
  sentence_id uuid references public.personal_sentences(id) on delete set null,
  feedback_type text not null,
  input_text text not null,
  output_json jsonb,
  created_at timestamptz default now()
);

create table if not exists public.daily_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_date date not null,
  captured_entries integer default 0,
  reviews_completed integer default 0,
  personal_sentences_created integer default 0,
  speaking_practices integer default 0,
  listening_minutes integer default 0,
  completed boolean default false,
  created_at timestamptz default now(),
  unique(user_id, goal_date)
);

create table if not exists public.music_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  artist text,
  genre text,
  source_url text,
  studied_excerpt text,
  excerpt_translation text,
  context_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.roleplay_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  description text,
  difficulty text default 'easy',
  is_system boolean default false,
  created_at timestamptz default now()
);

create index if not exists learning_entries_user_created_idx
  on public.learning_entries(user_id, created_at desc);
create index if not exists chunks_user_status_idx
  on public.chunks(user_id, status);
create index if not exists reviews_user_due_idx
  on public.reviews(user_id, due_at);
create index if not exists personal_sentences_user_entry_idx
  on public.personal_sentences(user_id, entry_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists learning_entries_set_updated_at on public.learning_entries;
create trigger learning_entries_set_updated_at
before update on public.learning_entries
for each row execute function public.set_updated_at();

drop trigger if exists chunks_set_updated_at on public.chunks;
create trigger chunks_set_updated_at
before update on public.chunks
for each row execute function public.set_updated_at();

drop trigger if exists personal_sentences_set_updated_at on public.personal_sentences;
create trigger personal_sentences_set_updated_at
before update on public.personal_sentences
for each row execute function public.set_updated_at();

drop trigger if exists music_items_set_updated_at on public.music_items;
create trigger music_items_set_updated_at
before update on public.music_items
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data ->> 'name')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.learning_entries enable row level security;
alter table public.chunks enable row level security;
alter table public.personal_sentences enable row level security;
alter table public.tags enable row level security;
alter table public.entry_tags enable row level security;
alter table public.reviews enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.practice_answers enable row level security;
alter table public.audio_records enable row level security;
alter table public.ai_feedbacks enable row level security;
alter table public.daily_goals enable row level security;
alter table public.music_items enable row level security;
alter table public.roleplay_scenarios enable row level security;

drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "entries crud own" on public.learning_entries;
create policy "entries crud own"
on public.learning_entries for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "chunks crud own" on public.chunks;
create policy "chunks crud own"
on public.chunks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "sentences crud own" on public.personal_sentences;
create policy "sentences crud own"
on public.personal_sentences for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "tags crud own" on public.tags;
create policy "tags crud own"
on public.tags for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "entry_tags select own" on public.entry_tags;
create policy "entry_tags select own"
on public.entry_tags for select
using (
  exists (
    select 1 from public.learning_entries e
    where e.id = entry_id and e.user_id = auth.uid()
  )
);

drop policy if exists "entry_tags insert own" on public.entry_tags;
create policy "entry_tags insert own"
on public.entry_tags for insert
with check (
  exists (
    select 1 from public.learning_entries e
    where e.id = entry_id and e.user_id = auth.uid()
  )
  and exists (
    select 1 from public.tags t
    where t.id = tag_id and t.user_id = auth.uid()
  )
);

drop policy if exists "entry_tags delete own" on public.entry_tags;
create policy "entry_tags delete own"
on public.entry_tags for delete
using (
  exists (
    select 1 from public.learning_entries e
    where e.id = entry_id and e.user_id = auth.uid()
  )
);

drop policy if exists "reviews crud own" on public.reviews;
create policy "reviews crud own"
on public.reviews for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "practice_sessions crud own" on public.practice_sessions;
create policy "practice_sessions crud own"
on public.practice_sessions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "practice_answers crud own" on public.practice_answers;
create policy "practice_answers crud own"
on public.practice_answers for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "audio_records crud own" on public.audio_records;
create policy "audio_records crud own"
on public.audio_records for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "ai_feedbacks crud own" on public.ai_feedbacks;
create policy "ai_feedbacks crud own"
on public.ai_feedbacks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "daily_goals crud own" on public.daily_goals;
create policy "daily_goals crud own"
on public.daily_goals for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "music_items crud own" on public.music_items;
create policy "music_items crud own"
on public.music_items for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "roleplay select own or system" on public.roleplay_scenarios;
create policy "roleplay select own or system"
on public.roleplay_scenarios for select
using (is_system = true or auth.uid() = user_id);

drop policy if exists "roleplay insert own" on public.roleplay_scenarios;
create policy "roleplay insert own"
on public.roleplay_scenarios for insert
with check (auth.uid() = user_id and coalesce(is_system, false) = false);

drop policy if exists "roleplay update own" on public.roleplay_scenarios;
create policy "roleplay update own"
on public.roleplay_scenarios for update
using (auth.uid() = user_id and coalesce(is_system, false) = false)
with check (auth.uid() = user_id and coalesce(is_system, false) = false);

drop policy if exists "roleplay delete own" on public.roleplay_scenarios;
create policy "roleplay delete own"
on public.roleplay_scenarios for delete
using (auth.uid() = user_id and coalesce(is_system, false) = false);

insert into storage.buckets (id, name, public)
values
  ('audio-records', 'audio-records', false),
  ('entry-images', 'entry-images', false),
  ('source-screenshots', 'source-screenshots', false)
on conflict (id) do nothing;

drop policy if exists "storage select own learning files" on storage.objects;
create policy "storage select own learning files"
on storage.objects for select
using (
  bucket_id in ('audio-records', 'entry-images', 'source-screenshots')
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "storage insert own learning files" on storage.objects;
create policy "storage insert own learning files"
on storage.objects for insert
with check (
  bucket_id in ('audio-records', 'entry-images', 'source-screenshots')
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "storage update own learning files" on storage.objects;
create policy "storage update own learning files"
on storage.objects for update
using (
  bucket_id in ('audio-records', 'entry-images', 'source-screenshots')
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id in ('audio-records', 'entry-images', 'source-screenshots')
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "storage delete own learning files" on storage.objects;
create policy "storage delete own learning files"
on storage.objects for delete
using (
  bucket_id in ('audio-records', 'entry-images', 'source-screenshots')
  and auth.uid()::text = (storage.foldername(name))[1]
);

insert into public.roleplay_scenarios (title, category, description, is_system)
values
  ('Jogo online', 'game', 'What are you farming today?', true),
  ('Debug simples', 'programming', 'What are you trying to fix?', true),
  ('Rotina diaria', 'routine', 'What are you going to do today?', true)
on conflict do nothing;
