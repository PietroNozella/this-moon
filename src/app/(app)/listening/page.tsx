"use client";

import { useEffect, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { completeListeningPractice } from "@/server/actions/learning";
import type { EntryRow } from "@/types/database";

export default function ListeningPage() {
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("learning_entries")
        .select("id, original_phrase, translation, entry_type")
        .order("created_at", { ascending: false })
        .limit(20);

      setEntries((data ?? []) as EntryRow[]);
      setLoading(false);
    }

    void load();
  }, []);

  async function handleComplete() {
    setPending(true);
    const entry = entries[currentIndex];
    if (!entry) return;

    try {
      await completeListeningPractice(entry.id);
      if (currentIndex < entries.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        setDone(true);
      }
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <Card className="text-slate-500">Carregando...</Card>;
  }

  if (entries.length === 0) {
    return (
      <Card className="border-dashed text-slate-500">
        <CardTitle>Listening</CardTitle>
        <p className="mt-2">Capture frases primeiro para praticar listening.</p>
      </Card>
    );
  }

  if (done) {
    return (
      <div className="space-y-6">
        <Card className="border-candy-blue-500/30 bg-candy-blue-500/10 text-center">
          <CardTitle>Listening de hoje concluído!</CardTitle>
          <p className="mt-2 text-sm text-slate-600">
            Volte amanhã para mais prática.
          </p>
        </Card>
        <ButtonLink href="/listening" variant="secondary" className="w-full">
          Recomeçar
        </ButtonLink>
      </div>
    );
  }

  const entry = entries[currentIndex];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-candy-blue-700">Listening</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-onyx">
          Treine seu ouvido
        </h1>
      </div>

      <p className="text-sm text-slate-500">
        {currentIndex + 1} de {entries.length}
      </p>

      <Card className="text-center">
        <p className="text-lg font-medium text-slate-500">Imagine a frase sendo falada em inglês.</p>
        <p className="mt-6 text-2xl font-semibold text-onyx">
          {entry?.original_phrase}
        </p>
        {entry?.translation ? (
          <p className="mt-3 text-sm text-slate-500">{entry.translation}</p>
        ) : null}
        <span className="mt-4 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          {entry?.entry_type === "verb" ? "Verbo" : "Chunk"}
        </span>
      </Card>

      <Button
        className="w-full"
        size="lg"
        disabled={pending}
        onClick={handleComplete}
      >
        {pending ? "Salvando..." : "Ouvi e entendi"}
      </Button>

      <ButtonLink
        href="/listening"
        variant="secondary"
        className="w-full"
        onClick={() => setCurrentIndex(0)}
      >
        Recomeçar
      </ButtonLink>
    </div>
  );
}
