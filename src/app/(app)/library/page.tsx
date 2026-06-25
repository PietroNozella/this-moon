"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form";
import { useLocalStore } from "@/components/local-store-provider";
import { formatDate } from "@/lib/utils";
import { difficulties, entryStatuses, sourceTypes } from "@/lib/validators/learning";
import { getLibraryEntries, type LibraryFilters } from "@/lib/local-selectors";

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

export default function LibraryPage() {
  const { state, isLoaded } = useLocalStore();
  const [filters, setFilters] = useState<LibraryFilters>({});
  const entries = useMemo(
    () => getLibraryEntries(state, filters),
    [state, filters],
  );

  if (!isLoaded) {
    return <Card className="text-slate-500">Carregando biblioteca local...</Card>;
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
        {entries.length > 0 ? (
          entries.map((entry) => (
            <Link key={entry.id} href={`/library/${entry.id}`}>
              <Card className="transition hover:border-slate-300 hover:shadow-md">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={entry.status} />
                      <Badge>{sourceLabels[entry.source_type] ?? entry.source_type}</Badge>
                      <Badge>{difficultyLabels[entry.difficulty ?? "unknown"]}</Badge>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-slate-950">
                      {entry.original_phrase}
                    </h2>
                    {entry.translation ? (
                      <p className="mt-1 text-slate-600">{entry.translation}</p>
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
                    <Badge key={tag}>#{tag}</Badge>
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

