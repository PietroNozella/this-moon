"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";

import { ChunkProgressForm } from "@/components/forms/chunk-progress-form";
import { PersonalSentenceForm } from "@/components/forms/personal-sentence-form";
import { StatusBadge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SourcePill } from "@/components/ui/source-pill";
import { EntryEnrichment } from "@/components/entry-enrichment";
import { createClient } from "@/lib/supabase/client";
import { deleteEntry } from "@/server/actions/learning";
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


const practiceLabels: Record<string, string> = {
  listening: "Escuta",
  speaking: "Fala",
  shadowing: "Shadowing",
  review: "Revisão",
};

export default function EntryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<EntryDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const supabase = createClient();

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

      const [chunksResult, sentencesResult, sessionsResult] = await Promise.all([
        supabase.from("chunks").select("*").eq("entry_id", params.id),
        supabase
          .from("personal_sentences")
          .select("*")
          .eq("entry_id", params.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("practice_sessions")
          .select("*")
          .eq("entry_id", params.id)
          .order("created_at", { ascending: false }),
      ]);

      setEntry({
        ...(entryData as EntryRow),
        chunks: (chunksResult.data as ChunkRow[]) ?? [],
        personal_sentences: (sentencesResult.data as PersonalSentenceRow[]) ?? [],
        practice_sessions: (sessionsResult.data as PracticeSessionRow[]) ?? [],
      });
      setLoading(false);
    }

    void load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 lg:px-8">
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <Card className="space-y-4 border-dashed p-8 text-center">
          <p className="text-base font-semibold text-slate-900">Entrada não encontrada.</p>
          <ButtonLink href="/library" variant="secondary">
            Voltar para a Biblioteca
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

  function updateEntryProgress(progress: Pick<EntryRow, "status" | "difficulty" | "confidence_level">) {
    setEntry((current) => (current ? { ...current, ...progress } : current));
  }

  function addPersonalSentence(sentence: PersonalSentenceRow) {
    setEntry((current) => (
      current
        ? { ...current, personal_sentences: [sentence, ...current.personal_sentences] }
        : current
    ));
  }

  return (
    <ChunkDetail
      entry={entry}
      onDelete={handleDelete}
      deleting={deleting}
      onProgressSaved={updateEntryProgress}
      onSentenceCreated={addPersonalSentence}
    />
  );
}

function ChunkDetail({
  entry,
  onDelete,
  deleting,
  onProgressSaved,
  onSentenceCreated,
}: {
  entry: EntryDetailData;
  onDelete: () => Promise<void>;
  deleting: boolean;
  onProgressSaved: (progress: Pick<EntryRow, "status" | "difficulty" | "confidence_level">) => void;
  onSentenceCreated: (sentence: PersonalSentenceRow) => void;
}) {
  const mainChunk = entry.chunks[0];
  const chunkText = mainChunk?.chunk_text || entry.original_phrase;
  const hasNotes = !!(
    entry.translation ||
    entry.natural_phrase ||
    entry.context_note ||
    entry.pronunciation_note ||
    entry.grammar_note ||
    mainChunk?.natural_version ||
    mainChunk?.casual_version
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Criado em {formatDate(entry.created_at)}</span>
              {entry.source_type ? <SourcePill type={entry.source_type} title={entry.source_title} timestamp={entry.source_timestamp} /> : null}
            </div>
            <h1 className="mt-3 text-2xl font-semibold leading-snug tracking-tight text-slate-950 md:text-3xl">
              {chunkText}
            </h1>
            <div className="mt-3">
              <StatusBadge value={entry.status} />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              {`Dificuldade: ${difficultyLabels[entry.difficulty ?? "unknown"]} • Entendimento: ${
                entry.confidence_level ? `${entry.confidence_level}/5` : "sem nota"
              } • Prática: ${
                entry.times_practiced ? `${entry.times_practiced}x` : "não praticado"
              }`}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <ButtonLink href={`/practice?entryId=${entry.id}`} size="sm">
              Praticar
            </ButtonLink>
            <ButtonLink href="/library" variant="secondary" size="sm">
              Voltar
            </ButtonLink>
          </div>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-4">
          {hasNotes ? <ChunkNotes entry={entry} mainChunk={mainChunk} /> : null}
          <EntryEnrichment entryId={entry.id} />
          <PracticeHistory sessions={entry.practice_sessions} />
        </main>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Progresso</p>
                <h2 className="mt-1 text-base font-semibold text-slate-950">Como estou neste chunk</h2>
              </div>
            </div>
            <ChunkProgressForm
              entryId={entry.id}
              value={{
                status: entry.status,
                difficulty: entry.difficulty,
                confidence_level: entry.confidence_level,
              }}
              onSaved={onProgressSaved}
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Treino ativo</p>
              <h2 className="mt-1 text-base font-semibold text-slate-950">Criar frase com o chunk</h2>
            </div>
            <PersonalSentenceForm entryId={entry.id} chunkId={mainChunk?.id} compact onCreated={onSentenceCreated} />
          </section>

          <PersonalSentencesList sentences={entry.personal_sentences} />

          <details className="group rounded-2xl border border-red-100 bg-white shadow-sm">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-red-500 [&::-webkit-details-marker]:hidden">
              <span>Excluir entrada</span>
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-red-100 p-4">
              <Button variant="danger" size="sm" className="w-full" disabled={deleting} onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting ? "Excluindo..." : "Excluir definitivamente"}
              </Button>
            </div>
          </details>
        </aside>
      </div>
    </div>
  );
}

function ChunkNotes({ entry, mainChunk }: { entry: EntryDetailData; mainChunk?: ChunkRow }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm" open>
      <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 [&::-webkit-details-marker]:hidden">
        <span>Notas do chunk</span>
        <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="grid gap-3 border-t border-slate-100 p-4 text-sm leading-6 text-slate-600 md:grid-cols-2">
        {entry.translation ? <NoteItem label="Significado" value={entry.translation} /> : null}
        {entry.context_note ? <NoteItem label="Meu contexto" value={entry.context_note} /> : null}
        {entry.natural_phrase || mainChunk?.natural_version ? <NoteItem label="Natural" value={entry.natural_phrase ?? mainChunk?.natural_version ?? ""} /> : null}
        {mainChunk?.casual_version ? <NoteItem label="Casual" value={mainChunk.casual_version} /> : null}
        {entry.pronunciation_note ? <NoteItem label="Pronúncia" value={entry.pronunciation_note} /> : null}
        {entry.grammar_note ? <NoteItem label="Observação" value={entry.grammar_note} /> : null}
      </div>
    </details>
  );
}

function NoteItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-slate-700">{value}</p>
    </div>
  );
}

function PersonalSentencesList({ sentences }: { sentences: PersonalSentenceRow[] }) {
  if (!sentences.length) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
        Nenhuma frase criada ainda.
      </section>
    );
  }

  return (
    <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm" open={sentences.length <= 3}>
      <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 [&::-webkit-details-marker]:hidden">
        <span>Minhas frases ({sentences.length})</span>
        <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="max-h-72 space-y-2 overflow-y-auto border-t border-slate-100 p-3">
        {sentences.map((sentence) => (
          <div key={sentence.id} className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-900">{sentence.sentence}</p>
            {sentence.translation ? <p className="mt-1 text-xs text-slate-500">{sentence.translation}</p> : null}
            {sentence.corrected_sentence ? <p className="mt-1 text-xs text-emerald-700">Corrigida: {sentence.corrected_sentence}</p> : null}
          </div>
        ))}
      </div>
    </details>
  );
}

function PracticeHistory({ sessions }: { sessions: PracticeSessionRow[] }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 [&::-webkit-details-marker]:hidden">
        <span>Histórico de prática</span>
        <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-slate-100 p-3">
        {sessions.length ? (
          <div className="grid gap-2 md:grid-cols-2">
            {sessions.slice(0, 6).map((session) => (
              <div key={session.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span className="font-medium">{practiceLabels[session.mode] ?? session.mode}</span>
                  <span>{formatDate(session.created_at)}</span>
                </div>
                {session.notes ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{session.notes}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">Nenhuma prática registrada.</p>
        )}
      </div>
    </details>
  );
}