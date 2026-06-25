"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/utils";
import type { EntryRow } from "@/types/database";

const PAGE_SIZE = 15;

export default function ReviewPage() {
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [sentencesToday, setSentencesToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      setLoading(true);
      const today = todayISO();

      const [countRes, { data: allEntries }, { data: goal }] =
        await Promise.all([
          supabase
            .from("learning_entries")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("learning_entries")
            .select("id, original_phrase, entry_type")
            .order("created_at", { ascending: false })
            .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
          supabase
            .from("daily_goals")
            .select("personal_sentences_created")
            .eq("goal_date", today)
            .single(),
        ]);

      const total = countRes.count ?? 0;
      setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
      setEntries((allEntries ?? []) as EntryRow[]);
      setSentencesToday(goal?.personal_sentences_created ?? 0);
      setLoading(false);
    }

    void load();
  }, [page]);

  if (loading) {
    return <Card className="text-slate-500">Carregando...</Card>;
  }

  const done = sentencesToday >= 5;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Revisão</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-950">
          Criar frases próprias
        </h1>
      </div>

      <Card className={done ? "border-emerald-200 bg-emerald-50" : ""}>
        <CardTitle>Progresso de hoje</CardTitle>
        <p className="mt-2 text-sm text-slate-600">
          {done
            ? "Você já criou 5 frases próprias hoje!"
            : `${sentencesToday} de 5 frases próprias criadas hoje.`}
        </p>
      </Card>

      <Card>
        <CardTitle>Suas entradas</CardTitle>
        <div className="mt-4 divide-y divide-slate-100">
          {entries.length > 0 ? (
            entries.map((entry) => (
              <Link
                key={entry.id}
                href={`/library/${entry.id}`}
                className="flex items-center gap-2 py-3 transition hover:text-emerald-700"
              >
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
                  {entry.entry_type === "verb" ? "V" : "C"}
                </span>
                <p className="font-medium text-slate-950">
                  {entry.original_phrase}
                </p>
              </Link>
            ))
          ) : (
            <p className="py-6 text-sm text-slate-500">
              Nenhuma entrada capturada ainda.
            </p>
          )}
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </Card>

      <ButtonLink href="/library" className="w-full">
        Ir para biblioteca
      </ButtonLink>
    </div>
  );
}
