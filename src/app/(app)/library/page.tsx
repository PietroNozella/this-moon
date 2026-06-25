"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { difficulties, entryStatuses, sourceTypes } from "@/lib/validators/learning";
import type { ChunkRow, EntryRow, TagRow } from "@/types/database";

const sourceLabels: Record<string, string> = {
  music: "Música",
  video: "Vídeo",
  game: "Jogo",
  programming: "Programação",
  conversation: "Conversa",
  social_media: "Social media",
  course: "Curso",
  book: "Livro",
  routine: "Rotina",
  other: "Outro",
};

const statusLabels: Record<string, string> = {
  new: "Novo",
  learning: "Aprendendo",
  practicing: "Praticando",
  almost_natural: "Quase natural",
  mastered: "Dominado",
  archived: "Arquivado",
};

const difficultyLabels: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
  unknown: "Sem nível",
};

type LibraryEntry = EntryRow & {
  chunks: ChunkRow[];
  tags: TagRow[];
};

export default function LibraryPage() {
  const supabase = createClient();
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    q?: string;
    status?: string;
    source?: string;
    difficulty?: string;
  }>({});

  useEffect(() => {
    async function load() {
      const entriesData = (await supabase
        .from("learning_entries")
        .select("*")
        .order("created_at", { ascending: false })).data ?? [];

      const chunksData = (await supabase
        .from("chunks")
        .select("*")).data ?? [];

      const { data: entryTagsData } = await supabase
        .from("entry_tags")
        .select("entry_id, tag_id");

      const tagsData = (await supabase.from("tags").select("*")).data ?? [];
      const rawEntryTags = (entryTagsData ?? []) as unknown as {
        entry_id: string;
        tag_id: string;
        tags: TagRow;
      }[];

      const tagMap = new Map((tagsData as TagRow[]).map((t) => [t.id, t]));
      const entryTagsMap = new Map<string, TagRow[]>();

      for (const et of rawEntryTags) {
        const tag = tagMap.get(et.tag_id);
        if (tag) {
          const existing = entryTagsMap.get(et.entry_id) ?? [];
          existing.push(tag as TagRow);
          entryTagsMap.set(et.entry_id, existing);
        }
      }

      const rawChunks = chunksData as ChunkRow[];
      const chunkMap = new Map<string, ChunkRow[]>();
      for (const chunk of rawChunks) {
        if (chunk.entry_id) {
          const existing = chunkMap.get(chunk.entry_id) ?? [];
          existing.push(chunk);
          chunkMap.set(chunk.entry_id, existing);
        }
      }

      const rawEntries = entriesData as EntryRow[];
      const merged: LibraryEntry[] = rawEntries.map((entry) => ({
        ...entry,
        chunks: chunkMap.get(entry.id) ?? [],
        tags: entryTagsMap.get(entry.id) ?? [],
      }));

      setEntries(merged);
      setLoading(false);
    }

    void load();
  }, []);

  const filtered = useMemo(() => {
    const search = filters.q?.trim().toLowerCase();

    return entries.filter((entry) => {
      if (filters.status && entry.status !== filters.status) return false;
      if (filters.source && entry.source_type !== filters.source) return false;
      if (filters.difficulty && entry.difficulty !== filters.difficulty)
        return false;
      if (!search) return true;

      return [entry.original_phrase, entry.translation, entry.context_note]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [entries, filters]);

  if (loading) {
    return <Card className="text-slate-500">Carregando biblioteca...</Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Biblioteca</p>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Biblioteca de frases
          </h1>
        </div>
        <ButtonLink href="/capture">Nova captura</ButtonLink>
      </div>

      <Card>
        <form
          className="grid gap-3 md:grid-cols-[1fr_180px_180px_180px_auto]"
          onSubmit={(event) => event.preventDefault()}
        >
          <Input
            name="q"
            placeholder="Buscar frase, tradução ou contexto"
            value={filters.q ?? ""}
            onChange={(event) =>
              setFilters((current) => ({ ...current, q: event.target.value }))
            }
          />
          <Select
            name="status"
            value={filters.status ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value || undefined,
              }))
            }
          >
            <option value="">Status</option>
            {entryStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </Select>
          <Select
            name="source"
            value={filters.source ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                source: event.target.value || undefined,
              }))
            }
          >
            <option value="">Fonte</option>
            {sourceTypes.map((source) => (
              <option key={source} value={source}>
                {sourceLabels[source]}
              </option>
            ))}
          </Select>
          <Select
            name="difficulty"
            value={filters.difficulty ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                difficulty: event.target.value || undefined,
              }))
            }
          >
            <option value="">Dificuldade</option>
            {difficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficultyLabels[difficulty]}
              </option>
            ))}
          </Select>
          <button
            type="button"
            onClick={() => setFilters({})}
            className="h-10 rounded-md bg-slate-950 px-4 text-sm font-medium text-white"
          >
            Limpar
          </button>
        </form>
      </Card>

      <div className="grid gap-4">
        {filtered.length > 0 ? (
          filtered.map((entry) => (
            <Link key={entry.id} href={`/library/${entry.id}`}>
              <Card className="transition hover:border-slate-300 hover:shadow-md">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={entry.status} />
                      <Badge>
                        {sourceLabels[entry.source_type] ?? entry.source_type}
                      </Badge>
                      <Badge>
                        {difficultyLabels[entry.difficulty ?? "unknown"]}
                      </Badge>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-slate-950">
                      {entry.original_phrase}
                    </h2>
                    {entry.translation ? (
                      <p className="mt-1 text-slate-600">
                        {entry.translation}
                      </p>
                    ) : null}
                    {entry.context_note ? (
                      <p className="mt-3 text-sm text-slate-500">
                        {entry.context_note}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-sm text-slate-400">
                    {formatDate(entry.created_at)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {entry.chunks.map((chunk) => (
                    <Badge key={chunk.id}>{chunk.chunk_text}</Badge>
                  ))}
                  {entry.tags.map((tag) => (
                    <Badge key={tag.id}>#{tag.name}</Badge>
                  ))}
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="border-dashed text-center text-slate-500">
            Sua biblioteca ainda está vazia. Capture sua primeira frase.
          </Card>
        )}
      </div>
    </div>
  );
}
