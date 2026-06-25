"use client";

import { useEffect, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { completeSpeakingPractice } from "@/server/actions/learning";
import type { EntryRow } from "@/types/database";

const steps = [
  { key: "read", label: "Leia em voz alta" },
  { key: "slow", label: "Repita devagar" },
  { key: "natural", label: "Fale no ritmo natural" },
  { key: "blind", label: "Fale sem olhar" },
  { key: "variation", label: "Crie uma variação" },
] as const;

export default function SpeakingPage() {
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

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
      await completeSpeakingPractice(entry.id);
      if (currentIndex < entries.length - 1) {
        setCurrentIndex((i) => i + 1);
        setCompletedSteps(new Set());
      } else {
        setDone(true);
      }
    } finally {
      setPending(false);
    }
  }

  function toggleStep(key: string) {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  if (loading) {
    return <Card className="text-slate-500">Carregando...</Card>;
  }

  if (entries.length === 0) {
    return (
      <Card className="border-dashed text-slate-500">
        <CardTitle>Speaking</CardTitle>
        <p className="mt-2">Capture frases primeiro para praticar speaking.</p>
      </Card>
    );
  }

  if (done) {
    return (
      <div className="space-y-6">
        <Card className="border-candy-blue-500/30 bg-candy-blue-500/10 text-center">
          <CardTitle>Speaking de hoje concluído!</CardTitle>
          <p className="mt-2 text-sm text-slate-600">
            Volte amanhã para mais prática.
          </p>
        </Card>
        <ButtonLink href="/speaking" variant="secondary" className="w-full">
          Recomeçar
        </ButtonLink>
      </div>
    );
  }

  const entry = entries[currentIndex];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-candy-blue-700">Speaking</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-onyx">
          Fale em voz alta
        </h1>
      </div>

      <p className="text-sm text-slate-500">
        {currentIndex + 1} de {entries.length}
      </p>

      <Card className="text-center">
        <p className="text-2xl font-semibold text-onyx">
          {entry?.original_phrase}
        </p>
        {entry?.translation ? (
          <p className="mt-3 text-sm text-slate-500">{entry.translation}</p>
        ) : null}
        <span className="mt-4 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          {entry?.entry_type === "verb" ? "Verbo" : "Chunk"}
        </span>
      </Card>

      <Card>
        <CardTitle>Etapas</CardTitle>
        <div className="mt-4 space-y-2">
          {steps.map((step) => {
            const done = completedSteps.has(step.key);
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => toggleStep(step.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left text-sm transition",
                  done
                    ? "border-candy-blue-500/30 bg-candy-blue-500/10 text-onyx"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    done ? "bg-candy-blue-500 text-white" : "border border-slate-300 text-slate-400",
                  )}
                >
                  {done ? "✓" : steps.indexOf(step) + 1}
                </span>
                {step.label}
              </button>
            );
          })}
        </div>
      </Card>

      <Button
        className="w-full"
        size="lg"
        disabled={pending || completedSteps.size < steps.length}
        onClick={handleComplete}
      >
        {pending
          ? "Salvando..."
          : completedSteps.size < steps.length
            ? `Complete todas as ${steps.length} etapas`
            : "Praticado!"}
      </Button>

      <ButtonLink
        href="/speaking"
        variant="secondary"
        className="w-full"
        onClick={() => { setCurrentIndex(0); setCompletedSteps(new Set()); }}
      >
        Recomeçar
      </ButtonLink>
    </div>
  );
}
