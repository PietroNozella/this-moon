-- Normaliza entradas antigas de verbo para o modelo unico de chunks.
insert into public.chunks (
  user_id,
  entry_id,
  chunk_text,
  translation,
  usage_note,
  created_at,
  updated_at
)
select
  e.user_id,
  e.id,
  e.original_phrase,
  e.translation,
  e.context_note,
  coalesce(e.created_at, now()),
  now()
from public.learning_entries e
where e.entry_type = 'verb'
  and not exists (
    select 1
    from public.chunks c
    where c.entry_id = e.id
  );

update public.learning_entries
set entry_type = 'chunk',
    updated_at = now()
where entry_type = 'verb';