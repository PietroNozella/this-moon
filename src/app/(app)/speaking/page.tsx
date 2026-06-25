"use client";

import { useEffect, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfidenceScale } from "@/components/ui/confidence-scale";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PhraseBlock } from "@/components/ui/phrase-block";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { completeSpeakingPractice } from "@/server/actions/learning";
import type { EntryRow } from "@/types/database";

const steps = [
  { key: "read", label: "Leia" },
  { key: "slow", label: "Fale devagar" },
  { key: "natural", label: "Fale natural" },
  { key: "blind", label: "Fale sem olhar" },
] as const;

export default function SpeakingPage() {
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("learning_entries")
        .select("id, original_phrase, translation, source_type, source_title, natural_phrase, pronunciation_note, context_note, entry_type")
        .order("created_at", { ascending: false })
        .limit(20);

      setEntries((data ?? []) as EntryRow[]);
      setLoading(false);
    }

    void load();
  }, []);

  async function handleComplete() {
    if (!entry || !rating) return;
    setPending(true);

    try {
      await completeSpeakingPractice(entry.id);
      if (currentIndex < entries.length - 1) {
        setCurrentIndex((i) => i + 1);
        setCompletedSteps(new Set());
        setShowTranslation(false);
        setRating(null);
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

  function handleNext() {
    if (currentIndex < entries.length - 1) {
      setCurrentIndex((i) => i + 1);
      setCompletedSteps(new Set());
      setShowTranslation(false);
      setRating(null);
    } else {
      setDone(true);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-80 animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Speaking"
          subtitle="Repita frases curtas até conseguir usar naturalmente."
        />
        <EmptyState
          title="Nada aqui ainda"
          description="Capture uma frase real para começar."
          actionLabel="Capturar chunk"
          actionHref="/capture"
        />
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Speaking"
          subtitle="Repita frases curtas até conseguir usar naturalmente."
        />
        <Card important className="border-candy-blue-500/30 bg-candy-blue-500/10 text-center">
          <p className="text-base font-semibold text-candy-blue-950">
            Speaking de hoje concluído!
          </p>
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
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Speaking"
        subtitle="Repita frases curtas até conseguir usar naturalmente."
      />

      <p className="text-sm text-slate-500">
        {currentIndex + 1} de {entries.length}
      </p>

      <Card className="p-6 shadow-md" important>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Speaking practice
          </span>
          <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200">
            {entry?.entry_type === "verb" ? "Verbo" : "Chunk"}
          </span>
        </div>

        <div className="mt-5">
          <PhraseBlock
            phrase={entry?.original_phrase ?? ""}
            translation={showTranslation ? entry?.translation : undefined}
            naturalPhrase={entry?.natural_phrase}
          />
        </div>

        {!showTranslation && entry?.translation ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => setShowTranslation(true)}
          >
            Mostrar tradução
          </Button>
        ) : null}

        {entry?.context_note ? (
          <p className="mt-4 text-sm text-slate-500">
            Use quando: {entry.context_note}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {steps.map((step) => {
            const doneStep = completedSteps.has(step.key);
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => toggleStep(step.key)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition-all duration-200",
                  doneStep
                    ? "border-candy-blue-500/50 bg-candy-blue-500/20 text-candy-blue-950"
                    : "border-slate-200 bg-slate-100 text-slate-600 hover:border-slate-300",
                )}
              >
                {doneStep ? "✓ " : ""}
                {step.label}
              </button>
            );
          })}
        </div>

        {entry?.pronunciation_note ? (
          <div className="mt-5 rounded-xl border border-candy-blue-500/40 bg-candy-blue-500/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-candy-blue-950">
              Nota de pronúncia
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {entry.pronunciation_note}
            </p>
          </div>
        ) : null}

        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-slate-700">
            Como você falou?
          </p>
          <ConfidenceScale value={rating} onChange={setRating} />
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={handleNext}>
          Praticar outro
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={!rating || pending || completedSteps.size < steps.length}
          onClick={handleComplete}
        >
          {pending
            ? "Salvando..."
            : completedSteps.size < steps.length
              ? `Complete as ${steps.length} etapas`
              : "Concluir speaking"}
        </Button>
      </div>
    </div>
  );
}
