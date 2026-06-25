-- Adiciona entry_id em practice_sessions para vincular pratica ao chunk
alter table public.practice_sessions
add column if not exists entry_id uuid references public.learning_entries(id) on delete set null;

create index if not exists practice_sessions_entry_idx
on public.practice_sessions(user_id, entry_id);
