"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { StatusBadge, TypeBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { Pagination } from "@/components/ui/pagination";
import { createClient } from "@/lib/supabase/client";
import { entryStatuses } from "@/lib/validators/learning";
import type { EntryRow } from "@/types/database";

const PAGE_SIZE = 12;

const statusLabels: Record<string, string> = {
  new: "Novo",
  learning: "Aprendendo",
  practicing: "Praticando",
  almost_natural: "Quase natural",
  mastered: "Dominado",
  archived: "Arquivado",
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

      const dataRes = await dataQuery;
      setEntries((dataRes.data ?? []) as EntryRow[]);
      setLoading(false);
    }

    void load();
  }, [filters, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Biblioteca</p>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Biblioteca
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
              setFiltersAndReset({
                ...filters,
                q: event.target.value || undefined,
              })
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
              setFiltersAndReset({
                ...filters,
                status: event.target.value || undefined,
              })
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
              setFiltersAndReset({
                ...filters,
                type: event.target.value || undefined,
              })
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
            onClick={() => setFiltersAndReset({})}
            className="h-10 rounded-md bg-slate-950 px-4 text-sm font-medium text-white"
          >
            Limpar
          </button>
        ) : null}
      </div>

      {loading ? (
        <Card className="text-slate-500">Carregando...</Card>
      ) : (
        <>
          <div className="grid gap-4">
            {entries.length > 0 ? (
              entries.map((entry) => (
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
                Nenhum resultado encontrado.
              </Card>
            )}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
