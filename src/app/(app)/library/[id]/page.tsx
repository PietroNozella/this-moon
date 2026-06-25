"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { PersonalSentenceForm } from "@/components/forms/personal-sentence-form";
import { StatusForm } from "@/components/forms/status-form";
import { StatusBadge, TypeBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SourcePill } from "@/components/ui/source-pill";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type {
  ChunkRow,
  EntryRow,
  PersonalSentenceRow,
  PracticeSessionRow,
} from "@/types/database";

type EntryDetailData = EntryRow & {
  chunks: ChunkRow[];
  personal_sentences: PersonalSentenceRow[];
  practice_sessions: PracticeSessionRow[];
};

export default function EntryDetailPage() {
  const params = useParams<{ id: string }>();
  const [entry, setEntry] = useState<EntryDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: entryData } = await supabase
        .from("learning_entries")
        .select("*")
        .eq("id", params.id)
        .single();

      if (!entryData) {
        setLoading(false);
        return;
      }

      const [chunksResult, sentencesResult, sessionsResult] =
        await Promise.all([
          supabase.from("chunks").select("*").eq("entry_id", params.id),
          supabase
            .from("personal_sentences")
            .select("*")
            .eq("entry_id", params.id),
          supabase
            .from("practice_sessions")
            .select("*")
            .eq("entry_id", params.id)
            .order("created_at", { ascending: false }),
        ]);

      setEntry({
        ...(entryData as EntryRow),
        chunks: (chunksResult.data as ChunkRow[]) ?? [],
        personal_sentences:
          (sentencesResult.data as PersonalSentenceRow[]) ?? [],
        practice_sessions:
          (sessionsResult.data as PracticeSessionRow[]) ?? [],
      });
      setLoading(false);
    }

    void load();
  }, [params.id]);

  const mainChunk = entry?.chunks[0];
  const difficultyLabels: Record<string, string> = {
    easy: "Fácil",
    medium: "Médio",
    hard: "Difícil",
    unknown: "Não sei",
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-10 lg:px-10">
        <div className="h-24 animate-pulse rounded-3xl bg-slate-200" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-96 animate-pulse rounded-3xl bg-slate-200" />
          <div className="h-96 animate-pulse rounded-3xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <Card className="space-y-4 border-dashed p-8 text-center">
          <p className="text-base font-semibold text-slate-900">
            Entrada não encontrada.
          </p>
          <ButtonLink href="/library" variant="secondary">
            Voltar para biblioteca
          </ButtonLink>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">
      {/* ── Header ── */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-500">
            Criado em {formatDate(entry.created_at)}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {entry.original_phrase}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <TypeBadge value={entry.entry_type} />
            <StatusBadge value={entry.status} />
            {entry.difficulty ? (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {difficultyLabels[entry.difficulty] ?? entry.difficulty}
              </span>
            ) : null}
            {entry.source_type ? (
              <SourcePill
                type={entry.source_type}
                title={entry.source_title}
                timestamp={entry.source_timestamp}
              />
            ) : null}
          </div>
        </div>
        <ButtonLink
          href="/library"
          variant="secondary"
          size="sm"
          className="shrink-0"
        >
          Voltar
        </ButtonLink>
      </div>

      {/* ── Grid principal ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* ================================================================ */}
        {/* COLUNA PRINCIPAL                                                  */}
        {/* ================================================================ */}
        <div className="space-y-6">
          {/* ── Frase ── */}
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Frase
            </p>
            <p className="mt-4 text-2xl font-semibold leading-10 tracking-tight text-slate-950">
              {entry.original_phrase}
            </p>
            {entry.translation ? (
              <p className="mt-3 text-base italic leading-7 text-slate-500">
                {entry.translation}
              </p>
            ) : null}
            {entry.natural_phrase ? (
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Versão natural
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {entry.natural_phrase}
                </p>
              </div>
            ) : null}
            {entry.pronunciation_note ? (
              <div className="mt-4 rounded-2xl border border-candy-blue-500/40 bg-candy-blue-500/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-candy-blue-950">
                  Pronúncia
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {entry.pronunciation_note}
                </p>
              </div>
            ) : null}
            {entry.grammar_note ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Observação
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {entry.grammar_note}
                </p>
              </div>
            ) : null}
          </div>

          {/* ── Onde usar? ── */}
          {entry.context_note ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-lg font-semibold tracking-tight text-slate-950">
                Onde usar?
              </p>
              <p className="mt-3 leading-7 text-slate-600">
                {entry.context_note}
              </p>
            </div>
          ) : null}

          {/* ── Padrões (verbos) ── */}
          {entry.verb_patterns &&
          Array.isArray(entry.verb_patterns) &&
          entry.verb_patterns.length > 0 ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Padrões
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(entry.verb_patterns as string[]).map((pattern, i) => (
                  <span
                    key={i}
                    className="rounded-xl border border-candy-blue-500/50 bg-candy-blue-500/20 px-3 py-1 text-sm text-candy-blue-950"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* ── Chunk (dados da tabela chunks) ── */}
          {mainChunk ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Chunk
              </p>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                {mainChunk.chunk_text}
              </p>
              {mainChunk.natural_version ? (
                <p className="mt-2 text-sm text-slate-500">
                  <span className="font-medium text-slate-600">
                    Natural:{" "}
                  </span>
                  {mainChunk.natural_version}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* ── Frases próprias ── */}
          {entry.personal_sentences.length > 0 ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Frases próprias
              </p>
              <div className="mt-4 space-y-3">
                {entry.personal_sentences.map((sentence) => (
                  <div
                    key={sentence.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-medium leading-6 text-slate-950">
                      {sentence.sentence}
                    </p>
                    {sentence.translation ? (
                      <p className="mt-1 text-sm italic leading-6 text-slate-500">
                        {sentence.translation}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* ── Histórico de prática ── */}
          {entry.practice_sessions.length > 0 ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Histórico de prática
              </p>
              <div className="mt-4 space-y-3">
                {entry.practice_sessions.slice(0, 5).map((session) => (
                  <div
                    key={session.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium">
                        {session.mode === "listening"
                          ? "Escuta Guiada"
                          : session.mode === "speaking"
                            ? "Speaking"
                            : session.mode === "shadowing"
                              ? "Shadowing"
                              : session.mode}
                      </span>
                      <span>{formatDate(session.created_at)}</span>
                    </div>
                    {session.notes ? (
                      <p className="mt-1 text-sm leading-6 text-slate-600 line-clamp-2">
                        {session.notes}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Histórico de prática
              </p>
              <div className="mt-4 rounded-2xl bg-slate-50 p-6 text-center ring-1 ring-slate-200/70">
                <p className="text-sm font-medium text-slate-700">
                  Você ainda não praticou este chunk.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Comece pela Escuta Guiada ou pelo Speaking para registrar sua
                  evolução.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <ButtonLink
                    href="/listening"
                    variant="primary"
                    size="sm"
                  >
                    Treinar Escuta Guiada
                  </ButtonLink>
                  <ButtonLink
                    href="/speaking"
                    variant="secondary"
                    size="sm"
                  >
                    Treinar Speaking
                  </ButtonLink>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* SIDEBAR                                                          */}
        {/* ================================================================ */}
        <div className="space-y-5">
          {/* ── Ações rápidas ── */}
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Ações rápidas
            </p>
            <div className="mt-4 space-y-3">
              <ButtonLink
                href="/listening"
                variant="primary"
                className="w-full"
              >
                Treinar Escuta Guiada
              </ButtonLink>
              <ButtonLink
                href="/speaking"
                variant="secondary"
                className="w-full"
              >
                Treinar Speaking
              </ButtonLink>
            </div>
          </div>

          {/* ── Status do chunk ── */}
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Status do chunk
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <StatusForm
                entryId={entry.id}
                currentStatus={entry.status}
              />
            </div>
          </div>

          {/* ── Evolução ── */}
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Evolução
            </p>
            <div className="mt-4 divide-y divide-slate-100 text-sm">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Status</span>
                <span className="font-medium text-slate-950">
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
                              : entry.status ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Dificuldade</span>
                <span className="font-medium text-slate-950">
                  {difficultyLabels[entry.difficulty ?? "unknown"]}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Confiança</span>
                <span className="font-medium text-slate-950">
                  {entry.confidence_level
                    ? `${entry.confidence_level}/5`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Praticado</span>
                <span className="font-medium text-slate-950">
                  {entry.times_practiced
                    ? `${entry.times_practiced}x`
                    : "0 vezes"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 last:pb-0">
                <span className="text-slate-500">Última prática</span>
                <span className="font-medium text-slate-950">
                  {entry.last_practiced_at
                    ? formatDate(entry.last_practiced_at)
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* ── Fonte ── */}
          {entry.source_type ||
          entry.source_title ||
          entry.source_url ? (
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Fonte
              </p>
              <div className="mt-4 space-y-3">
                <SourcePill
                  type={entry.source_type}
                  title={entry.source_title}
                  timestamp={entry.source_timestamp}
                />
                {entry.source_url ? (
                  <a
                    href={entry.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm text-candy-blue-700 transition-colors hover:text-candy-blue-950 hover:underline"
                  >
                    Abrir link
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* ── Sua frase usando este chunk ── */}
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Sua frase usando este chunk
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Crie uma frase sua para transformar este chunk em fala real.
            </p>
            <div className="mt-4">
              <PersonalSentenceForm
                entryId={entry.id}
                chunkId={mainChunk?.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
