"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { StatusBadge, TypeBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";
import { entryStatuses } from "@/lib/validators/learning";
import type { EntryRow } from "@/types/database";

const statusLabels: Record<string, string> = {
  new: "Novo",
  learning: "Aprendendo",
  practicing: "Praticando",
  almost_natural: "Quase natural",
  mastered: "Dominado",
  archived: "Arquivado",
};

export default function LibraryPage() {
  const supabase = createClient();
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    q?: string;
    status?: string;
    type?: string;
  }>({});

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("learning_entries")
        .select("*")
        .order("created_at", { ascending: false });

      setEntries((data ?? []) as EntryRow[]);
      setLoading(false);
    }

    void load();
  }, []);

  const filtered = useMemo(() => {
    const search = filters.q?.trim().toLowerCase();

    return entries.filter((entry) => {
      if (filters.status && entry.status !== filters.status) return false;
      if (filters.type && entry.entry_type !== filters.type) return false;
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

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="filter-search">Buscar</Label>
          <Input
            id="filter-search"
            name="q"
            value={filters.q ?? ""}
            onChange={(event) =>
              setFilters((current) => ({ ...current, q: event.target.value }))
            }
            className="max-w-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-status">Status</Label>
          <Select
            id="filter-status"
            name="status"
            value={filters.status ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value || undefined,
              }))
            }
            className="w-40"
          >
            <option value="">Todos</option>
            {entryStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-type">Tipo</Label>
          <Select
            id="filter-type"
            name="type"
            value={filters.type ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                type: event.target.value || undefined,
              }))
            }
            className="w-32"
          >
            <option value="">Todos</option>
            <option value="chunk">Chunk</option>
            <option value="verb">Verbo</option>
          </Select>
        </div>
        {filters.q || filters.status || filters.type ? (
          <button
            type="button"
            onClick={() => setFilters({})}
            className="h-10 rounded-md bg-slate-950 px-4 text-sm font-medium text-white"
          >
            Limpar
          </button>
        ) : null}
      </div>

      <div className="grid gap-4">
        {filtered.length > 0 ? (
          filtered.map((entry) => (
            <Link key={entry.id} href={`/library/${entry.id}`}>
              <Card className="transition hover:border-slate-300 hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge value={entry.status} />
                      <TypeBadge value={entry.entry_type} />
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-slate-950">
                      {entry.original_phrase}
                    </h2>
                    {entry.translation ? (
                      <p className="mt-1 text-slate-600">
                        {entry.translation}
                      </p>
                    ) : null}
                  </div>
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
