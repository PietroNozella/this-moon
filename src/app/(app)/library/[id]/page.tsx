"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";

import { PersonalSentenceForm } from "@/components/forms/personal-sentence-form";
import { SentenceWithAIFeedback } from "@/components/ai/sentence-with-ai-feedback";
import { AIActionPanel } from "@/components/ai/ai-action-panel";
import { StatusForm } from "@/components/forms/status-form";
import { StatusBadge, TypeBadge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/form";
import { SourcePill } from "@/components/ui/source-pill";
import { createClient } from "@/lib/supabase/client";
import { completeVerbPatternPractice, deleteEntry } from "@/server/actions/learning";
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

const difficultyLabels: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
  unknown: "Não sei",
};

export default function EntryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<EntryDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
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

  async function handleDelete() {
    if (!entry) return;
    if (!window.confirm("Tem certeza que deseja excluir esta entrada permanentemente?")) return;

    setDeleting(true);
    try {
      await deleteEntry(entry.id);
      router.push("/library");
    } catch {
      alert("Erro ao excluir entrada.");
      setDeleting(false);
    }
  }

  if (entry.entry_type === "verb") {
    return <VerbDetail entry={entry} onDelete={handleDelete} deleting={deleting} />;
  }

  return <ChunkDetail entry={entry} onDelete={handleDelete} deleting={deleting} />;
}
function ChunkHeader({ entry }: { entry: EntryDetailData }) {
  return (
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
  );
}

function VerbHeader({ entry }: { entry: EntryDetailData }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-500">
          Criado em {formatDate(entry.created_at)}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          {entry.original_phrase}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Verbo para construir frases</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <TypeBadge value={entry.entry_type} />
          <StatusBadge value={entry.status} />
          {entry.difficulty ? (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {difficultyLabels[entry.difficulty] ?? entry.difficulty}
            </span>
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
  );
}

/* ── Chunk Detail ── */

function ChunkDetail({ entry, onDelete, deleting }: { entry: EntryDetailData; onDelete: () => Promise<void>; deleting: boolean }) {
  const mainChunk = entry.chunks[0];

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">
      <ChunkHeader entry={entry} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          {/* ── Frase ── */}
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Frase</p>
            <p className="mt-4 text-2xl font-semibold leading-10 tracking-tight text-slate-950">
              {entry.original_phrase}
            </p>
            {entry.translation ? (
              <p className="mt-3 text-base italic leading-7 text-slate-500">{entry.translation}</p>
            ) : null}
            {entry.natural_phrase ? (
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Versão natural</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{entry.natural_phrase}</p>
              </div>
            ) : null}
            {entry.pronunciation_note ? (
              <div className="mt-4 rounded-2xl border border-candy-blue-500/40 bg-candy-blue-500/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-candy-blue-950">Pronúncia</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{entry.pronunciation_note}</p>
              </div>
            ) : null}
            {entry.grammar_note ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Observação</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{entry.grammar_note}</p>
              </div>
            ) : null}
          </div>

          {entry.context_note ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-lg font-semibold tracking-tight text-slate-950">Onde usar?</p>
              <p className="mt-3 leading-7 text-slate-600">{entry.context_note}</p>
            </div>
          ) : null}

          {mainChunk ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Chunk</p>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{mainChunk.chunk_text}</p>
              {mainChunk.natural_version ? (
                <p className="mt-2 text-sm text-slate-500"><span className="font-medium text-slate-600">Natural: </span>{mainChunk.natural_version}</p>
              ) : null}
            </div>
          ) : null}

          {entry.personal_sentences.length > 0 ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Frases próprias</p>
              <div className="mt-4 space-y-3">
                {entry.personal_sentences.map((sentence) => (
                  <SentenceWithAIFeedback
                    key={sentence.id}
                    sentence={sentence}
                    showTranslation
                  />
                ))}
              </div>
            </div>
          ) : null}

          {entry.practice_sessions.length > 0 ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Histórico de prática</p>
              <div className="mt-4 space-y-3">
                {entry.practice_sessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium">
                        {session.mode === "listening" ? "Escuta Guiada" : session.mode === "speaking" ? "Speaking" : session.mode === "shadowing" ? "Shadowing" : session.mode}
                      </span>
                      <span>{formatDate(session.created_at)}</span>
                    </div>
                    {session.notes ? (
                      <p className="mt-1 text-sm leading-6 text-slate-600 line-clamp-2">{session.notes}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Histórico de prática</p>
              <div className="mt-4 rounded-2xl bg-slate-50 p-6 text-center ring-1 ring-slate-200/70">
                <p className="text-sm font-medium text-slate-700">Você ainda não praticou este chunk.</p>
                <p className="mt-1 text-sm text-slate-500">Comece pela Escuta Guiada ou pelo Speaking para registrar sua evolução.</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <ButtonLink href="/listening" variant="primary" size="sm">Treinar Escuta Guiada</ButtonLink>
                  <ButtonLink href="/speaking" variant="secondary" size="sm">Treinar Speaking</ButtonLink>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Ações rápidas</p>
            <div className="mt-4 space-y-3">
              <ButtonLink href="/listening" variant="primary" className="w-full">Treinar Escuta Guiada</ButtonLink>
              <ButtonLink href="/speaking" variant="secondary" className="w-full">Treinar Speaking</ButtonLink>
            </div>
          </div>

          <AIActionPanel entryId={entry.id} phrase={entry.original_phrase} />

          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status do chunk</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <StatusForm entryId={entry.id} currentStatus={entry.status} />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Evolução</p>
            <div className="mt-4 divide-y divide-slate-100 text-sm">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Status</span>
                <span className="font-medium text-slate-950">{entry.status === "new" ? "Novo" : entry.status === "learning" ? "Aprendendo" : entry.status === "practicing" ? "Praticando" : entry.status === "almost_natural" ? "Quase natural" : entry.status === "mastered" ? "Dominado" : entry.status === "archived" ? "Arquivado" : entry.status ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Dificuldade</span>
                <span className="font-medium text-slate-950">{difficultyLabels[entry.difficulty ?? "unknown"]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Confiança</span>
                <span className="font-medium text-slate-950">{entry.confidence_level ? `${entry.confidence_level}/5` : "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Praticado</span>
                <span className="font-medium text-slate-950">{entry.times_practiced ? `${entry.times_practiced}x` : "0 vezes"}</span>
              </div>
              <div className="flex items-center justify-between py-2 last:pb-0">
                <span className="text-slate-500">Última prática</span>
                <span className="font-medium text-slate-950">{entry.last_practiced_at ? formatDate(entry.last_practiced_at) : "—"}</span>
              </div>
            </div>
          </div>

          {entry.source_type || entry.source_title || entry.source_url ? (
            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Fonte</p>
              <div className="mt-4 space-y-3">
                <SourcePill type={entry.source_type} title={entry.source_title} timestamp={entry.source_timestamp} />
                {entry.source_url ? (
                  <a href={entry.source_url} target="_blank" rel="noopener noreferrer" className="block truncate text-sm text-candy-blue-700 transition-colors hover:text-candy-blue-950 hover:underline">Abrir link</a>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sua frase usando este chunk</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Crie uma frase sua para transformar este chunk em fala real.</p>
            <div className="mt-4">
              <PersonalSentenceForm entryId={entry.id} chunkId={mainChunk?.id} />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Perigo</p>
            <Button
              variant="danger"
              className="mt-4 w-full"
              disabled={deleting}
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? "Excluindo..." : "Excluir entrada"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Verb Detail ── */

function VerbDetail({ entry, onDelete, deleting }: { entry: EntryDetailData; onDelete: () => Promise<void>; deleting: boolean }) {
  const [sentences, setSentences] = useState<string[]>([""]);
  const [pending, setPending] = useState(false);

  const patterns = (entry.verb_patterns as string[]) ?? [];

  function addSentence() {
    setSentences((prev) => [...prev, ""]);
  }

  function updateSentence(index: number, value: string) {
    setSentences((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function removeSentence(index: number) {
    setSentences((prev) => prev.filter((_, i) => i !== index));
  }

  async function handlePractice() {
    const filled = sentences.filter((s) => s.trim().length >= 2);
    if (filled.length === 0) return;
    setPending(true);
    try {
      await completeVerbPatternPractice({ entryId: entry.id, sentences: filled });
      setSentences([""]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">
      <VerbHeader entry={entry} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          {/* ── Verbo ── */}
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Verbo</p>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{entry.original_phrase}</p>
            {entry.translation ? (
              <p className="mt-2 text-base italic leading-7 text-slate-500">{entry.translation}</p>
            ) : null}
            {entry.context_note ? (
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Quando usar</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{entry.context_note}</p>
              </div>
            ) : null}
          </div>

          {/* ── Padrões ── */}
          {patterns.length > 0 ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Padrões</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {patterns.map((pattern, i) => (
                  <span key={i} className="rounded-xl border border-candy-blue-500/50 bg-candy-blue-500/20 px-3 py-1 text-sm text-candy-blue-950">{pattern}</span>
                ))}
              </div>
            </div>
          ) : null}

          {/* ── Treinar padrões ── */}
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Treinar padrões</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Crie frases usando este verbo com padrões diferentes.</p>

            {patterns.length > 0 ? (
              <div className="mt-4 space-y-3">
                {patterns.slice(0, 6).map((pattern, i) => (
                  <div key={i} className="rounded-xl border border-candy-blue-500/30 bg-candy-blue-500/10 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-candy-blue-950">{pattern}</p>
                    <p className="mt-1 text-sm text-slate-500">Ex: {pattern.replace("...", entry.original_phrase.replace("to ", "") + " [something]")}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              {sentences.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                    <Textarea
                    value={s}
                    onChange={(e) => updateSentence(i, e.target.value)}
                    className="min-h-20 flex-1"
                  />
                  {sentences.length > 1 ? (
                    <button type="button" onClick={() => removeSentence(i)} className="mt-2 text-xs text-red-500 hover:underline shrink-0">Remover</button>
                  ) : null}
                </div>
              ))}
              <button type="button" onClick={addSentence} className="text-sm font-medium text-candy-blue-700 hover:underline">+ Adicionar mais uma frase</button>
            </div>

            <Button type="button" className="mt-5 w-full" disabled={pending || sentences.every((s) => s.trim().length < 2)} onClick={handlePractice}>
              {pending ? "Salvando..." : "Salvar frases"}
            </Button>
          </div>

          {/* ── Frases criadas ── */}
          {entry.personal_sentences.length > 0 ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Frases criadas</p>
              <div className="mt-4 space-y-3">
                {entry.personal_sentences.map((sentence) => (
                  <SentenceWithAIFeedback
                    key={sentence.id}
                    sentence={sentence}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* ── Histórico ── */}
          {entry.practice_sessions.length > 0 ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Histórico</p>
              <div className="mt-4 space-y-3">
                {entry.practice_sessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium">{session.mode === "review" ? "Treino de verbo" : session.mode}</span>
                      <span>{formatDate(session.created_at)}</span>
                    </div>
                    {session.notes ? (
                      <p className="mt-1 text-sm leading-6 text-slate-600 line-clamp-2">{session.notes}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Histórico</p>
              <div className="mt-4 rounded-2xl bg-slate-50 p-6 text-center ring-1 ring-slate-200/70">
                <p className="text-sm font-medium text-slate-700">Nenhuma prática registrada ainda.</p>
                <p className="mt-1 text-sm text-slate-500">Crie frases com os padrões acima para começar.</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Ações rápidas</p>
            <div className="mt-4 space-y-3">
              <ButtonLink href={`/library/${entry.id}`} variant="primary" className="w-full">Treinar padrões</ButtonLink>
              <ButtonLink href="/library" variant="secondary" className="w-full">Usar com conectores</ButtonLink>
            </div>
          </div>

          <AIActionPanel entryId={entry.id} phrase={entry.original_phrase} />

          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <StatusForm entryId={entry.id} currentStatus={entry.status} />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Evolução</p>
            <div className="mt-4 divide-y divide-slate-100 text-sm">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Status</span>
                <span className="font-medium text-slate-950">{entry.status === "new" ? "Novo" : entry.status === "learning" ? "Aprendendo" : entry.status === "practicing" ? "Praticando" : entry.status === "almost_natural" ? "Quase natural" : entry.status === "mastered" ? "Dominado" : entry.status === "archived" ? "Arquivado" : entry.status ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Dificuldade</span>
                <span className="font-medium text-slate-950">{difficultyLabels[entry.difficulty ?? "unknown"]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Frases criadas</span>
                <span className="font-medium text-slate-950">{entry.personal_sentences.length}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Praticado</span>
                <span className="font-medium text-slate-950">{entry.times_practiced ? `${entry.times_practiced}x` : "0 vezes"}</span>
              </div>
              <div className="flex items-center justify-between py-2 last:pb-0">
                <span className="text-slate-500">Última prática</span>
                <span className="font-medium text-slate-950">{entry.last_practiced_at ? formatDate(entry.last_practiced_at) : "—"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sua frase com este verbo</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Crie uma frase sua usando este verbo.</p>
            <div className="mt-4">
              <PersonalSentenceForm entryId={entry.id} />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Perigo</p>
            <Button
              variant="danger"
              className="mt-4 w-full"
              disabled={deleting}
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? "Excluindo..." : "Excluir entrada"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
