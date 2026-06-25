"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { PersonalSentenceForm } from "@/components/forms/personal-sentence-form";
import { StatusForm } from "@/components/forms/status-form";
import { StatusBadge, TypeBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
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

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
        <div className="grid gap-6 md:grid-cols-[1.5fr_0.8fr]">
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="mx-auto max-w-4xl">
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

  const difficultyLabels: Record<string, string> = {
    easy: "Fácil",
    medium: "Médio",
    hard: "Difícil",
    unknown: "Não sei",
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{formatDate(entry.created_at)}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            {entry.original_phrase}
          </h1>
        </div>
        <ButtonLink href="/library" variant="secondary" size="sm">
          Voltar
        </ButtonLink>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.5fr_0.8fr]">
        {/* Main content */}
        <div className="space-y-6">
          <Card>
            <CardTitle>Frase</CardTitle>
            <div className="mt-4 space-y-3">
              <p className="text-2xl font-semibold leading-10 tracking-tight text-slate-950">
                {entry.original_phrase}
              </p>
              {entry.translation ? (
                <p className="text-sm italic text-slate-500">{entry.translation}</p>
              ) : null}
              {entry.natural_phrase ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Versão natural
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{entry.natural_phrase}</p>
                </div>
              ) : null}
              {entry.pronunciation_note ? (
                <div className="rounded-xl border border-candy-blue-500/40 bg-candy-blue-500/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-candy-blue-950">
                    Pronúncia
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{entry.pronunciation_note}</p>
                </div>
              ) : null}
              {entry.grammar_note ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Observação
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{entry.grammar_note}</p>
                </div>
              ) : null}
            </div>
          </Card>

          <Section title="Onde usar?">{entry.context_note}</Section>

          {entry.verb_patterns && Array.isArray(entry.verb_patterns) && entry.verb_patterns.length > 0 ? (
            <Card>
              <CardTitle>Padrões</CardTitle>
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
            </Card>
          ) : null}

          {mainChunk ? (
            <Card>
              <CardTitle>Chunk</CardTitle>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {mainChunk.chunk_text}
              </p>
            </Card>
          ) : null}

          {entry.personal_sentences.length > 0 ? (
            <Card>
              <CardTitle>Frases próprias</CardTitle>
              <div className="mt-4 space-y-3">
                {entry.personal_sentences.map((sentence) => (
                  <div
                    key={sentence.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <p className="font-medium text-slate-950">
                      {sentence.sentence}
                    </p>
                    {sentence.translation ? (
                      <p className="mt-1 text-sm italic text-slate-500">
                        {sentence.translation}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {entry.practice_sessions.length > 0 ? (
            <Card>
              <CardTitle>Histórico de prática</CardTitle>
              <div className="mt-4 space-y-3">
                {entry.practice_sessions.slice(0, 5).map((session) => (
                  <div
                    key={session.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3"
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
                      <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                        {session.notes}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <CardTitle>Histórico de prática</CardTitle>
              <p className="mt-2 text-sm text-slate-500">
                Você ainda não praticou este chunk.
              </p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardTitle>Ações rápidas</CardTitle>
            <div className="mt-4 flex flex-col gap-2">
              <ButtonLink
                href={`/listening`}
                variant="primary"
                className="w-full"
                size="sm"
              >
                Treinar Escuta Guiada
              </ButtonLink>
              <ButtonLink
                href={`/speaking`}
                variant="secondary"
                className="w-full"
                size="sm"
              >
                Treinar Speaking
              </ButtonLink>
              <StatusForm entryId={entry.id} currentStatus={entry.status} />
            </div>
          </Card>

          <Card>
            <CardTitle>Evolução</CardTitle>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status</span>
                <StatusBadge value={entry.status} />
              </div>
              {entry.confidence_level ? (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Confiança</span>
                  <span className="font-medium text-slate-900">{entry.confidence_level}/5</span>
                </div>
              ) : null}
              {entry.times_practiced ? (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Praticado</span>
                  <span className="font-medium text-slate-900">{entry.times_practiced}x</span>
                </div>
              ) : null}
              {entry.last_practiced_at ? (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Última prática</span>
                  <span className="font-medium text-slate-900">{formatDate(entry.last_practiced_at)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Dificuldade</span>
                <span className="font-medium text-slate-900">
                  {difficultyLabels[entry.difficulty ?? "unknown"]}
                </span>
              </div>
            </div>
          </Card>

          {(entry.source_type || entry.source_title || entry.source_url) ? (
            <Card>
              <CardTitle>Fonte</CardTitle>
              <div className="mt-4 space-y-2">
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
                    className="mt-2 block truncate text-sm text-candy-blue-700 hover:underline"
                  >
                    Abrir link
                  </a>
                ) : null}
              </div>
            </Card>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={entry.status} />
            <TypeBadge value={entry.entry_type} />
          </div>

          <Card>
            <PersonalSentenceForm entryId={entry.id} chunkId={mainChunk?.id} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  if (!children) return null;

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {children}
      </p>
    </Card>
  );
}
