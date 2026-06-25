"use client";

import { useEffect, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfidenceScale } from "@/components/ui/confidence-scale";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PhraseBlock } from "@/components/ui/phrase-block";
import { SourcePill } from "@/components/ui/source-pill";
import { Input, Label, Textarea } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";
import { completeListeningPractice } from "@/server/actions/learning";
import { Copy, ExternalLink, Eye, EyeOff, Headphones } from "lucide-react";
import type { EntryRow } from "@/types/database";

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
    parts.push(
      `\nVersão natural salva no meu sistema:\n"${entry.natural_phrase}"`,
    );
  }

  if (entry.context_note) {
    parts.push(`\nMeu contexto de uso:\n"${entry.context_note}"`);
  }

  if (entry.pronunciation_note) {
    parts.push(
      `\nMinha anotação de pronúncia:\n"${entry.pronunciation_note}"`,
    );
  }

  return parts.join("\n");
}

export default function ListeningPage() {
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [experience, setExperience] = useState("");
  const [repetitions, setRepetitions] = useState("");
  const [personalSentence, setPersonalSentence] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    setPending(true);

    try {
      await completeListeningPractice({
        entryId: entry.id,
        confidenceLevel: rating,
        listeningRepetitions: repetitions ? Number(repetitions) : undefined,
        notes: experience || undefined,
        personalSentence: personalSentence || undefined,
      });

      if (currentIndex < entries.length - 1) {
        setCurrentIndex((i) => i + 1);
        setShowTranslation(false);
        setRating(null);
        setExperience("");
        setRepetitions("");
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
      setExperience("");
      setRepetitions("");
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
          title="Escuta Guiada"
          subtitle="Use uma fonte externa para ouvir o chunk e registre o que conseguiu reconhecer."
        />
        <EmptyState
          title="Você ainda não tem chunks para treinar escuta."
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
          title="Escuta Guiada"
          subtitle="Use uma fonte externa para ouvir o chunk e registre o que conseguiu reconhecer."
        />
        <Card important className="border-candy-blue-500/30 bg-candy-blue-500/10 text-center">
          <p className="text-base font-semibold text-candy-blue-950">
            Escuta de hoje concluída!
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

  if (!entry) return null;

  const showCopyFeedback = copiedId === entry.id;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Escuta Guiada"
        subtitle="Use uma fonte externa para ouvir o chunk e registre o que conseguiu reconhecer."
      />

      {/* Card de instrução */}
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-candy-blue-500/20 text-candy-blue-700">
            <Headphones className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle>Como usar esta tela</CardTitle>
            <ol className="mt-3 space-y-1.5 text-sm leading-6 text-slate-600">
              <li>1. Escolha um chunk.</li>
              <li>
                2. Copie o treino para o ChatGPT ou abra a fonte original.
              </li>
              <li>3. Ouça sem olhar para a tradução.</li>
              <li>4. Volte aqui e escreva o que você reconheceu.</li>
              <li>5. Marque sua confiança e conclua a prática.</li>
            </ol>
            <ButtonLink
              href="/library"
              variant="ghost"
              size="sm"
              className="mt-3"
            >
              Ir para Biblioteca
            </ButtonLink>
          </div>
        </div>
      </Card>

      <p className="text-sm text-slate-500">
        {currentIndex + 1} de {entries.length}
      </p>

      {/* Card do chunk */}
      <Card className="p-6 shadow-md" important>
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium bg-candy-blue-500/25 text-candy-blue-950 border-candy-blue-500/50">
            {entry.entry_type === "verb" ? "Verbo" : "Chunk"}
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
              {entry.status === "new"
                ? "Novo"
                : entry.status === "learning"
                  ? "Aprendendo"
                  : entry.status === "practicing"
                    ? "Praticando"
                    : entry.status === "almost_natural"
                      ? "Quase natural"
                      : entry.status === "mastered"
                        ? "Dominado"
                        : entry.status === "archived"
                          ? "Arquivado"
                          : entry.status}
            </span>
          ) : null}
        </div>

        {/* Frase principal */}
        <div className="mt-5">
          <PhraseBlock
            phrase={entry.original_phrase}
            translation={showTranslation ? entry.translation : undefined}
            naturalPhrase={
              showTranslation ? entry.natural_phrase : undefined
            }
          />
        </div>

        {/* Área de apoio — botões de ação */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleCopy(entry)}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            {showCopyFeedback
              ? "Copiado!"
              : "Copiar treino para ChatGPT"}
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
              Abrir fonte original
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

        {/* Tradução expandida */}
        {showTranslation && entry.translation && (
          <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm italic text-slate-600">
              {entry.translation}
            </p>
            {entry.natural_phrase ? (
              <p className="text-sm text-slate-500">
                <span className="font-medium text-slate-600">
                  Natural:{" "}
                </span>
                {entry.natural_phrase}
              </p>
            ) : null}
            {entry.pronunciation_note ? (
              <div className="rounded-xl border border-candy-blue-500/40 bg-candy-blue-500/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-candy-blue-950">
                  Pronúncia
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {entry.pronunciation_note}
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Instrução prática */}
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <Headphones className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <p className="text-sm leading-6 text-slate-600">
            Antes de concluir: ouça o chunk com apoio externo e tente
            reconhecer o som sem depender da tradução.
          </p>
        </div>

        {/* Minha experiência ouvindo */}
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

        {/* ConfidenceScale */}
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-slate-700">
            Quanto você reconheceu?
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
              Transforme o chunk em uma frase sua. Isso ajuda a sair do
              inglês passivo e começar a falar de verdade.
            </p>
          </div>
        </div>
      </Card>

      {/* Botões de ação */}
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
          {pending ? "Salvando..." : "Concluir escuta guiada"}
        </Button>
      </div>
    </div>
  );
}
