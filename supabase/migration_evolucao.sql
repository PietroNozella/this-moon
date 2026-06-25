-- Adiciona colunas para suportar listening, speaking, ingles natural e pratica
alter table public.learning_entries
add column if not exists natural_phrase text,
add column if not exists pronunciation_note text,
add column if not exists grammar_note text,
add column if not exists source_timestamp text,
add column if not exists confidence_level int default 1,
add column if not exists last_practiced_at timestamptz,
add column if not exists times_practiced int default 0,
add column if not exists verb_patterns jsonb default '[]'::jsonb;

-- Adiciona colunas para a nova missao diaria com listening e shadowing
alter table public.daily_goals
add column if not exists listening_practices int default 0,
add column if not exists shadowing_practices int default 0,
add column if not exists practiced_entries int default 0;

-- Indices para as novas colunas
create index if not exists learning_entries_confidence_idx
on public.learning_entries(user_id, confidence_level);

create index if not exists learning_entries_last_practiced_idx
on public.learning_entries(user_id, last_practiced_at nulls first);
