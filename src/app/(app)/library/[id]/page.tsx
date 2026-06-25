"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { PersonalSentenceForm } from "@/components/forms/personal-sentence-form";
import { StatusForm } from "@/components/forms/status-form";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type {
  ChunkRow,
  EntryRow,
  PersonalSentenceRow,
} from "@/types/database";

type EntryDetailData = EntryRow & {
  chunks: ChunkRow[];
  personal_sentences: PersonalSentenceRow[];
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

      const [chunksResult, sentencesResult] = await Promise.all([
        supabase.from("chunks").select("*").eq("entry_id", params.id),
        supabase
          .from("personal_sentences")
          .select("*")
          .eq("entry_id", params.id),
      ]);

      setEntry({
        ...(entryData as EntryRow),
        chunks: (chunksResult.data as ChunkRow[]) ?? [],
        personal_sentences:
          (sentencesResult.data as PersonalSentenceRow[]) ?? [],
      });
      setLoading(false);
    }

    void load();
  }, [params.id]);

  const mainChunk = entry?.chunks[0];

  if (loading) {
    return <Card className="text-slate-500">Carregando entrada...</Card>;
  }

  if (!entry) {
    return (
      <Card className="space-y-4 border-dashed text-slate-500">
        <p>Entrada não encontrada.</p>
        <ButtonLink href="/library" variant="secondary">
          Voltar para biblioteca
        </ButtonLink>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            {formatDate(entry.created_at)}
          </p>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            {entry.original_phrase}
          </h1>
        </div>
        <ButtonLink href="/library" variant="secondary">
          Voltar
        </ButtonLink>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={entry.status} />
        {entry.source_type ? (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {entry.source_type}
          </span>
        ) : null}
      </div>

      <Section title="Tradução">{entry.translation}</Section>
      <Section title="Contexto">{entry.context_note}</Section>

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
                className="rounded-md border border-slate-200 p-3"
              >
                <p className="font-medium text-slate-950">
                  {sentence.sentence}
                </p>
                {sentence.translation ? (
                  <p className="mt-1 text-sm text-slate-500">
                    {sentence.translation}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card>
        <CardTitle>Status</CardTitle>
        <div className="mt-3">
          <StatusForm entryId={entry.id} currentStatus={entry.status} />
        </div>
      </Card>

      <Card>
        <PersonalSentenceForm entryId={entry.id} chunkId={mainChunk?.id} />
      </Card>
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
    <div>
      <CardTitle>{title}</CardTitle>
      <p className="mt-2 whitespace-pre-wrap text-slate-700">{children}</p>
    </div>
  );
}
