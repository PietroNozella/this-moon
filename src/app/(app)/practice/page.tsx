"use client";

import { useEffect, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfidenceScale } from "@/components/ui/confidence-scale";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { PhraseBlock } from "@/components/ui/phrase-block";
import { SourcePill } from "@/components/ui/source-pill";
import { AILoadingState } from "@/components/ai/ai-loading-state";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { completePractice } from "@/server/actions/learning";
import { generateListeningHelper } from "@/server/actions/ai";
import { Copy, ExternalLink, Eye, EyeOff, Headphones, Sparkles } from "lucide-react";
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
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [experience, setExperience] = useState("");
  const [repetitions, setRepetitions] = useState("");
  const [personalSentence, setPersonalSentence] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [listeningHelper, setListeningHelper] = useState<Record<string, unknown> | null>(null);
  const [helperLoading, setHelperLoading] = useState(false);
  const [helperError, setHelperError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("learning_entries")
        .select("id, original_phrase, translation, source_type, source_title, source_url, source_timestamp, natural_phrase, pronunciation_note, context_note, difficulty, status, entry_type")
        .eq("entry_type", "chunk")
        .order("created_at", { ascending: false })
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
    if (completedSteps.size < steps.length) return;
    setPending(true);

    try {
      await completePractice({
        entryId: entry.id,
        confidenceLevel: rating,
        listeningNotes: experience || undefined,
        listeningRepetitions: repetitions ? Number(repetitions) : undefined,
        personalSentence: personalSentence || undefined,
      });

      if (currentIndex < entries.length - 1) {
        setCurrentIndex((i) => i + 1);
        setCompletedSteps(new Set());
        setShowTranslation(false);
        setRating(null);
        setExperience("");
        setRepetitions("");
        setPersonalSentence("");
        setListeningHelper(null);
        setHelperError(null);
      } else {
        setDone(true);
      }
    } finally {
      setPending(false);
    }
  }

  async function handleListeningHelper(entryId: string) {
    setHelperLoading(true);
    setHelperError(null);
    setListeningHelper(null);
    const result = await generateListeningHelper(entryId);
    setHelperLoading(false);
    if (result.success) {
      setListeningHelper(result.data as unknown as Record<string, unknown>);
    } else {
      setHelperError(result.error);
    }
  }

  function handleSkip() {
    if (currentIndex < entries.length - 1) {
      setCurrentIndex((i) => i + 1);
      setCompletedSteps(new Set());
      setShowTranslation(false);
      setRating(null);
      setExperience("");
      setRepetitions("");
      setPersonalSentence("");
      setListeningHelper(null);
      setHelperError(null);
    } else {
      setDone(true);
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
          title="Prática"
          subtitle="Escute, repita e fale chunks até soar natural."
        />
        <EmptyState
          title="Você ainda não tem chunks para praticar."
          description="Capture uma frase real de música, jogo, vídeo ou conversa para começar."
          actionLabel="Capturar primeiro chunk"
          actionHref="/capture"
        />
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Prática"
          subtitle="Escute, repita e fale chunks até soar natural."
        />
        <Card important className="border-candy-blue-500/30 bg-candy-blue-500/10 text-center">
          <p className="text-base font-semibold text-candy-blue-950">
            Prática de hoje concluída!
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Volte amanhã para mais prática.
          </p>
        </Card>
        <ButtonLink href="/practice" variant="secondary" className="w-full">
          Recomeçar
        </ButtonLink>
      </div>
    );
  }

  const entry = entries[currentIndex];
  if (!entry) return null;

  const showCopyFeedback = copiedId === entry.id;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Prática"
        subtitle="Escute, repita e fale chunks até soar natural."
        action={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={helperLoading}
            onClick={() => void handleListeningHelper(entry.id)}
            className="gap-1.5 text-candy-blue-700 hover:text-candy-blue-950"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Dica de escuta
          </Button>
        }
      />

      <p className="text-sm text-slate-500">
        {currentIndex + 1} de {entries.length}
      </p>

      <Card className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70" important>
        {/* Cabeçalho com badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium bg-candy-blue-500/25 text-candy-blue-950 border-candy-blue-500/50">
            Chunk
          </span>
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
          {entry.status ? (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              {entry.status === "new" ? "Novo" : entry.status === "learning" ? "Aprendendo" : entry.status === "practicing" ? "Praticando" : entry.status === "almost_natural" ? "Quase natural" : entry.status === "mastered" ? "Dominado" : entry.status === "archived" ? "Arquivado" : entry.status}
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

        {/* Instrução de escuta */}
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <Headphones className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <p className="text-sm leading-6 text-slate-600">
            Copie o treino para uma ferramenta de áudio ou use a fonte original. Ouça sem olhar a tradução, depois volte e anote o que reconheceu.
          </p>
        </div>

        {/* AI Listening Helper */}
        {helperLoading ? (
          <div className="mt-4">
            <AILoadingState />
          </div>
        ) : null}
        {helperError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{helperError}</p>
          </div>
        ) : null}
        {listeningHelper ? (
          <div className="mt-5 space-y-3 rounded-2xl border border-candy-blue-500/30 bg-candy-blue-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-candy-blue-950">Dica de escuta</p>
            {Array.isArray(listeningHelper.focusWords) ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Foco nestas palavras</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {(listeningHelper.focusWords as string[]).map((w: string, i: number) => (
                    <span key={i} className="rounded-lg border border-candy-blue-500/40 bg-candy-blue-500/15 px-2 py-0.5 text-xs text-candy-blue-950">{w}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {listeningHelper.connectedSpeechTip ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Connected speech</p>
                <p className="mt-0.5 text-sm text-slate-700">{listeningHelper.connectedSpeechTip as string}</p>
              </div>
            ) : null}
            {Array.isArray(listeningHelper.listenFor) ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Preste atenção em</p>
                <ul className="mt-1 space-y-1">
                  {(listeningHelper.listenFor as string[]).map((l: string, i: number) => (
                    <li key={i} className="text-sm text-slate-700">• {l}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {listeningHelper.afterListeningQuestion ? (
              <div className="rounded-xl border border-candy-blue-500/30 bg-candy-blue-500/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-candy-blue-950">Depois de ouvir</p>
                <p className="mt-1 text-sm text-candy-blue-900">{listeningHelper.afterListeningQuestion as string}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Seção de escuta */}
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="experience">
              O que você reconheceu ao ouvir?
            </Label>
            <Textarea
              id="experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repetitions">
              Quantas vezes você ouviu?
            </Label>
            <Input
              id="repetitions"
              type="number"
              min={1}
              max={20}
              value={repetitions}
              onChange={(e) => setRepetitions(e.target.value)}
              className="max-w-32"
            />
          </div>
        </div>

        {/* Separador */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Agora fale
            </span>
          </div>
        </div>

        {/* Etapas de speaking */}
        <div className="flex flex-wrap gap-2">
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

        {/* Frase própria opcional */}
        <div className="mt-6 rounded-2xl border border-candy-blue-500/30 bg-candy-blue-500/10 p-4">
          <div className="space-y-2">
            <Label htmlFor="personal-sentence">
              Crie uma frase sua usando este chunk
            </Label>
            <Textarea
              id="personal-sentence"
              value={personalSentence}
              onChange={(e) => setPersonalSentence(e.target.value)}
            />
            <p className="text-xs leading-5 text-slate-500">
              Transforme o chunk em uma frase sua. Isso ajuda a sair do inglês passivo e começar a falar de verdade.
            </p>
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
          disabled={!rating || pending || completedSteps.size < steps.length}
          onClick={handleComplete}
        >
          {pending
            ? "Salvando..."
            : completedSteps.size < steps.length
              ? `Complete as ${steps.length} etapas de fala`
              : "Concluir prática"}
        </Button>
      </div>
    </div>
  );
}
