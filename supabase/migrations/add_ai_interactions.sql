create table if not exists public.ai_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  related_entry_id uuid references public.learning_entries(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.ai_interactions enable row level security;

create policy "Users can view own ai interactions"
on public.ai_interactions
for select
using (auth.uid() = user_id);

create policy "Users can insert own ai interactions"
on public.ai_interactions
for insert
with check (auth.uid() = user_id);

create policy "Users can delete own ai interactions"
on public.ai_interactions
for delete
using (auth.uid() = user_id);
