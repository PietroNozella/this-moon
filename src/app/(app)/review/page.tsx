"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/utils";
import type { EntryRow } from "@/types/database";

export default function ReviewPage() {
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [sentencesToday, setSentencesToday] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const today = todayISO();

      const [{ data: allEntries }, { data: goal }] = await Promise.all([
        supabase
          .from("learning_entries")
          .select("id, original_phrase")
          .order("created_at", { ascending: false }),
        supabase
          .from("daily_goals")
          .select("personal_sentences_created")
          .eq("goal_date", today)
          .single(),
      ]);

      setEntries((allEntries ?? []) as EntryRow[]);
      setSentencesToday(goal?.personal_sentences_created ?? 0);
      setLoading(false);
    }

    void load();
  }, []);

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
        <CardTitle>Seus chunks</CardTitle>
        <div className="mt-4 divide-y divide-slate-100">
          {entries.length > 0 ? (
            entries.map((entry) => (
              <Link
                key={entry.id}
                href={`/library/${entry.id}`}
                className="block py-3 transition hover:text-emerald-700"
              >
                <p className="font-medium text-slate-950">
                  {entry.original_phrase}
                </p>
              </Link>
            ))
          ) : (
            <p className="py-6 text-sm text-slate-500">
              Nenhum chunk capturado ainda.
            </p>
          )}
        </div>
      </Card>

      <ButtonLink href="/library" className="w-full">
        Ir para biblioteca
      </ButtonLink>
    </div>
  );
}
