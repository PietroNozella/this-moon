"use client";

import { useEffect, useState } from "react";

import { StatusBadge, TypeBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { createClient } from "@/lib/supabase/client";
import { difficulties, entryStatuses, sourceTypes } from "@/lib/validators/learning";
import { formatDate } from "@/lib/utils";
import type { EntryRow } from "@/types/database";

const PAGE_SIZE = 5;

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
  unknown: "Não sei",
};

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

export default function LibraryPage() {
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<{
    q?: string;
    status?: string;
    type?: string;
    source?: string;
    difficulty?: string;
  }>({});

  function setFiltersAndReset(newFilters: typeof filters) {
    setFilters(newFilters);
    setPage(1);
  }

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      setLoading(true);

      let query = supabase
        .from("learning_entries")
        .select("*", { count: "exact", head: true });

      const search = filters.q?.trim();
      if (search) {
        query = query.textSearch("original_phrase", search, {
          type: "websearch",
        });
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.type) {
        query = query.eq("entry_type", filters.type);
      }
      if (filters.source) {
        query = query.eq("source_type", filters.source);
      }
      if (filters.difficulty) {
        query = query.eq("difficulty", filters.difficulty);
      }

      const countRes = await query;
      const total = countRes.count ?? 0;
      const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      setTotalPages(pages);

      const pageIndex = Math.min(page, pages);
      if (pageIndex !== page) {
        setPage(pageIndex);
        return;
      }

      let dataQuery = supabase
        .from("learning_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (search) {
        dataQuery = dataQuery.textSearch("original_phrase", search, {
          type: "websearch",
        });
      }
      if (filters.status) {
        dataQuery = dataQuery.eq("status", filters.status);
      }
      if (filters.type) {
        dataQuery = dataQuery.eq("entry_type", filters.type);
      }
      if (filters.source) {
        dataQuery = dataQuery.eq("source_type", filters.source);
      }
      if (filters.difficulty) {
        dataQuery = dataQuery.eq("difficulty", filters.difficulty);
      }

      const dataRes = await dataQuery;
      setEntries((dataRes.data ?? []) as EntryRow[]);
      setLoading(false);
    }

    void load();
  }, [filters, page]);

  const hasFilters = filters.q || filters.status || filters.type || filters.source || filters.difficulty;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Biblioteca"
        subtitle="Todos os seus chunks, verbos e frases em evolução."
        action={
          <ButtonLink href="/capture" variant="primary" size="sm">
            Capturar novo
          </ButtonLink>
        }
      />

      <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
        <div className="space-y-1">
          <Label htmlFor="filter-search">Buscar</Label>
          <Input
            id="filter-search"
            value={filters.q ?? ""}
            onChange={(e) =>
              setFiltersAndReset({ ...filters, q: e.target.value || undefined })
            }
            placeholder="Buscar por frase, tradução ou contexto..."
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-status">Status</Label>
          <Select
            id="filter-status"
            value={filters.status ?? ""}
            onChange={(e) =>
              setFiltersAndReset({ ...filters, status: e.target.value || undefined })
            }
          >
            <option value="">Todos</option>
            {entryStatuses.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-type">Tipo</Label>
          <Select
            id="filter-type"
            value={filters.type ?? ""}
            onChange={(e) =>
              setFiltersAndReset({ ...filters, type: e.target.value || undefined })
            }
          >
            <option value="">Todos</option>
            <option value="chunk">Chunk</option>
            <option value="verb">Verbo</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-difficulty">Dificuldade</Label>
          <Select
            id="filter-difficulty"
            value={filters.difficulty ?? ""}
            onChange={(e) =>
              setFiltersAndReset({ ...filters, difficulty: e.target.value || undefined })
            }
          >
            <option value="">Todas</option>
            {difficulties.map((d) => (
              <option key={d} value={d}>
                {difficultyLabels[d]}
              </option>
            ))}
          </Select>
        </div>
        {hasFilters ? (
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setFiltersAndReset({})}
              className="rounded-xl bg-transparent px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Limpar filtros
            </button>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : entries.length > 0 ? (
        <div className="space-y-4">
          {entries.map((entry) => (
            <a
              key={entry.id}
              href={`/library/${entry.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={entry.status} />
                <TypeBadge value={entry.entry_type} />
                {entry.entry_type === "chunk" && entry.source_type ? (
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                    {sourceLabels[entry.source_type]}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-lg font-semibold tracking-tight text-onyx">
                {entry.original_phrase}
              </p>
              {entry.entry_type === "chunk" ? (
                <>
                  {(entry.translation || entry.natural_phrase) ? (
                    <p className="mt-0.5 text-sm text-slate-500 italic">
                      {entry.natural_phrase ?? entry.translation}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ButtonLink href={`/library/${entry.id}`} variant="ghost" size="sm">
                      Ver detalhe
                    </ButtonLink>
                  </div>
                </>
              ) : (
                <>
                  {entry.translation ? (
                    <p className="mt-0.5 text-sm text-slate-500">
                      {entry.translation}
                    </p>
                  ) : null}
                  {entry.verb_patterns && Array.isArray(entry.verb_patterns) && entry.verb_patterns.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(entry.verb_patterns as string[]).slice(0, 4).map((pattern, i) => (
                        <span key={i} className="rounded-lg border border-candy-blue-500/40 bg-candy-blue-500/15 px-2 py-0.5 text-xs text-candy-blue-950">
                          {pattern}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ButtonLink href={`/library/${entry.id}`} variant="ghost" size="sm">
                      Treinar padrões
                    </ButtonLink>
                  </div>
                </>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                {entry.last_practiced_at ? (
                  <span>Praticado {formatDate(entry.last_practiced_at)}</span>
                ) : null}
                {entry.times_practiced ? (
                  <span>{entry.times_practiced}x</span>
                ) : null}
              </div>
            </a>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Sua biblioteca ainda está vazia."
          description="Comece salvando uma frase curta que você ouviu ou leu hoje."
          actionLabel="Capturar aprendizado"
          actionHref="/capture"
        />
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
