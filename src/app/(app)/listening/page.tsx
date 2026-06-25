"use client";

import { useEffect, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfidenceScale } from "@/components/ui/confidence-scale";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PhraseBlock } from "@/components/ui/phrase-block";
import { SourcePill } from "@/components/ui/source-pill";
import { Textarea } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";
import { completeListeningPractice } from "@/server/actions/learning";
import type { EntryRow } from "@/types/database";

export default function ListeningPage() {
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("learning_entries")
        .select("id, original_phrase, translation, source_type, source_title, source_timestamp, natural_phrase, pronunciation_note, entry_type")
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
      await completeListeningPractice(entry.id);
      if (currentIndex < entries.length - 1) {
        setCurrentIndex((i) => i + 1);
        setShowTranslation(false);
        setRating(null);
        setNote("");
      } else {
        setDone(true);
      }
    } finally {
      setPending(false);
    }
  }

  function handleSkip() {
    if (currentIndex < entries.length - 1) {
      setCurrentIndex((i) => i + 1);
      setShowTranslation(false);
      setRating(null);
      setNote("");
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
        <PageHeader title="Listening" subtitle="Treine seu ouvido com frases reais que você encontrou." />
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
        <PageHeader title="Listening" subtitle="Treine seu ouvido com frases reais que você encontrou." />
        <Card important className="border-candy-blue-500/30 bg-candy-blue-500/10 text-center">
          <p className="text-base font-semibold text-candy-blue-950">
            Listening de hoje concluído!
          </p>
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Listening"
          subtitle="Treine seu ouvido com frases reais que você encontrou."
        />
      </div>

      <p className="text-sm text-slate-500">
        {currentIndex + 1} de {entries.length}
      </p>

      <Card className="p-6 shadow-md" important>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Listening practice
          </span>
          <SourcePill
            type={entry?.source_type ?? "other"}
            title={entry?.source_title}
            timestamp={entry?.source_timestamp}
          />
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

        {entry?.pronunciation_note ? (
          <p className="mt-4 rounded-xl border border-candy-blue-500/40 bg-candy-blue-500/20 px-4 py-3 text-sm text-slate-700">
            {entry.pronunciation_note}
          </p>
        ) : null}

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">O que fazer agora</p>
          <ol className="mt-3 space-y-1.5 text-sm text-slate-600">
            <li>1. Ouça o trecho sem letra.</li>
            <li>2. Reconheça palavras soltas.</li>
            <li>3. Ouça de novo com a frase na tela.</li>
            <li>4. Marque o quanto entendeu.</li>
          </ol>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-slate-700">
            Quanto você reconheceu?
          </p>
          <ConfidenceScale value={rating} onChange={setRating} />
        </div>

        <div className="mt-5">
          <label
            htmlFor="listening-note"
            className="text-sm font-medium text-slate-700"
          >
            O que você reconheceu?
          </label>
          <Textarea
            id="listening-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex: ouvi 'need', 'time', 'feel like'..."
            className="mt-2"
          />
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={handleSkip}>
          Pular
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={!rating || pending}
          onClick={handleComplete}
        >
          {pending ? "Salvando..." : "Concluir listening"}
        </Button>
      </div>
    </div>
  );
}
