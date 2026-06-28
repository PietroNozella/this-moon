"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink, Eye, EyeOff } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfidenceScale } from "@/components/ui/confidence-scale";
import { EmptyState } from "@/components/ui/empty-state";
import { Label, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { PhraseBlock } from "@/components/ui/phrase-block";
import { SourcePill } from "@/components/ui/source-pill";
import { cn, getCycleStartISO } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { completePractice } from "@/server/actions/learning";
import type { EntryRow } from "@/types/database";

const steps = [
  { key: "read", label: "Leia" },
  { key: "slow", label: "Fale devagar" },
  { key: "natural", label: "Fale natural" },
  { key: "blind", label: "Fale sem olhar" },
] as const;

const difficultyLabels: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
  unknown: "Não sei",
};

function buildPrompt(entry: EntryRow) {
  const parts = [
    `Repita este chunk para eu treinar listening e speaking:\n\n"${entry.original_phrase}"\n\nFale primeiro devagar.\nDepois fale em velocidade natural.\nDepois use em 3 frases simples.\nExplique a pronúncia de forma simples.\nSe existir uma forma mais natural ou casual, mostre também.`,
  ];

  if (entry.natural_phrase) {
    parts.push(`\nVersão natural salva no meu sistema:\n"${entry.natural_phrase}"`);
  }

  if (entry.context_note) {
    parts.push(`\nMeu contexto de uso:\n"${entry.context_note}"`);
  }

  if (entry.pronunciation_note) {
    parts.push(`\nMinha anotação de pronúncia:\n"${entry.pronunciation_note}"`);
  }

  return parts.join("\n");
}

export default function PracticePage() {
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [personalSentence, setPersonalSentence] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const cutoff = getCycleStartISO();

      const { data } = await supabase
        .from("learning_entries")
        .select("id, original_phrase, translation, source_type, source_title, source_url, source_timestamp, natural_phrase, pronunciation_note, context_note, difficulty, status, entry_type, last_practiced_at")
        .or(`last_practiced_at.is.null,last_practiced_at.lt.${cutoff}`)
        .order("last_practiced_at", { ascending: true, nullsFirst: true })
        .limit(20);

      setEntries((data ?? []) as EntryRow[]);
      setLoading(false);
    }

    void load();
  }, []);

  async function handleCopy(entry: EntryRow) {
    const prompt = buildPrompt(entry);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // clipboard not available
    }
  }

  async function handleComplete() {
    if (!entry || !rating) return;
    setPending(true);

    try {
      await completePractice({
        entryId: entry.id,
        confidenceLevel: rating,
        personalSentence: personalSentence || undefined,
      });

      if (currentIndex < entries.length - 1) {
        setCurrentIndex((i) => i + 1);
        setShowTranslation(false);
        setRating(null);
        setSelectedDifficulty(null);
        setPersonalSentence("");
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
      setSelectedDifficulty(null);
      setPersonalSentence("");
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
          title="Treinar"
          subtitle="Repita frases reais até soar natural."
        />
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-base font-semibold text-slate-950">
            Você já treinou tudo hoje!
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Volte amanhã às 6h para continuar praticando.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <ButtonLink href="/dashboard" variant="secondary">
              Ir para Hoje
            </ButtonLink>
            <ButtonLink href="/library" variant="secondary">
              Biblioteca
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Treinar"
          subtitle="Repita frases reais até soar natural."
        />
        <EmptyState
          title="Você já treinou todos os itens desta leva!"
          description="Volte amanhã para continuar praticando ou vá para a Biblioteca."
          actionLabel="Ir para Biblioteca"
          actionHref="/library"
        />
      </div>
    );
  }

  const entry = entries[currentIndex];
  if (!entry) return null;

  const showCopyFeedback = copiedId === entry.id;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Treinar"
        subtitle="Repita frases reais até soar natural."
      />

      <p className="text-sm text-slate-500">
        {currentIndex + 1} de {entries.length}
      </p>

      <Card className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70" important>
        {/* Cabeçalho com badges */}
        <div className="flex flex-wrap items-center gap-2">
          <SourcePill
            type={entry.source_type}
            title={entry.source_title}
            timestamp={entry.source_timestamp}
          />
          {entry.difficulty ? (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
              {difficultyLabels[entry.difficulty] ?? entry.difficulty}
            </span>
          ) : null}
        </div>

        {/* Frase principal */}
        <div className="mt-5">
          <PhraseBlock
            phrase={entry.original_phrase}
            translation={showTranslation ? entry.translation : undefined}
            naturalPhrase={showTranslation ? entry.natural_phrase : undefined}
          />
        </div>

        {/* Botões de ação */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleCopy(entry)}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            {showCopyFeedback ? "Copiado!" : "Copiar treino"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowTranslation((v) => !v)}
          >
            {showTranslation ? (
              <>
                <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                Esconder tradução
              </>
            ) : (
              <>
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                Mostrar tradução
              </>
            )}
          </Button>

          {entry.source_url ? (
            <a
              href={entry.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-candy-blue-700 transition-colors hover:bg-candy-blue-500/20"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Fonte original
            </a>
          ) : null}

          <ButtonLink
            href={`/library/${entry.id}`}
            variant="ghost"
            size="sm"
          >
            Ver detalhe
          </ButtonLink>
        </div>

        {/* Etapas de speaking (visual, não bloqueante) */}
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Sugestão de prática
          </p>
          <div className="flex flex-wrap gap-2">
            {steps.map((step) => (
              <span
                key={step.key}
                className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-500"
              >
                {step.label}
              </span>
            ))}
          </div>
        </div>

        {/* Nota de pronúncia */}
        {entry.pronunciation_note ? (
          <div className="mt-5 rounded-xl border border-candy-blue-500/40 bg-candy-blue-500/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-candy-blue-950">
              Nota de pronúncia
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {entry.pronunciation_note}
            </p>
          </div>
        ) : null}

        {/* Confiança */}
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-slate-700">
            Como você foi?
          </p>
          <ConfidenceScale value={rating} onChange={setRating} />
        </div>

        {/* Dificuldade */}
        {rating ? (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-slate-700">
              Qual a dificuldade?
            </p>
            <div className="flex flex-wrap gap-2">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDifficulty(d)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm transition-all",
                    selectedDifficulty === d
                      ? "border-onyx bg-onyx text-white"
                      : "border-slate-200 bg-slate-100 text-slate-600 hover:border-slate-300",
                  )}
                >
                  {difficultyLabels[d]}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Frase própria opcional */}
        <div className="mt-6 rounded-2xl border border-candy-blue-500/30 bg-candy-blue-500/10 p-4">
          <div className="space-y-2">
            <Label htmlFor="personal-sentence">
              Crie uma frase sua (opcional)
            </Label>
            <Textarea
              id="personal-sentence"
              value={personalSentence}
              onChange={(e) => setPersonalSentence(e.target.value)}
              placeholder="Ex: I need better gear to beat this boss."
            />
          </div>
        </div>
      </Card>

      {/* Botões de navegação */}
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
          {pending ? "Salvando..." : "Concluir"}
        </Button>
      </div>
    </div>
  );
}
