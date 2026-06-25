-- Adiciona coluna entry_type para diferenciar chunks de verbos
alter table public.learning_entries
add column if not exists entry_type text not null default 'chunk'
check (entry_type in ('chunk', 'verb'));

-- Adiciona coluna captured_verbs para as missoes diarias
alter table public.daily_goals
add column if not exists captured_verbs integer default 0;

-- Indice para filtrar por tipo
create index if not exists learning_entries_type_idx
on public.learning_entries(user_id, entry_type);
