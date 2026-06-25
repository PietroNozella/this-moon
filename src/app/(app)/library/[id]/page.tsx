"use client";

import { useParams } from "next/navigation";

import { PersonalSentenceForm } from "@/components/forms/personal-sentence-form";
import { StatusForm } from "@/components/forms/status-form";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useLocalStore } from "@/components/local-store-provider";
import { formatDate } from "@/lib/utils";
import { getEntryDetail } from "@/lib/local-selectors";

export default function EntryDetailPage() {
  const params = useParams<{ id: string }>();
  const { state, isLoaded } = useLocalStore();
  const entry = getEntryDetail(state, params.id);
  const mainChunk = entry?.chunks[0];

  if (!isLoaded) {
    return <Card className="text-slate-500">Carregando entrada...</Card>;
  }

  if (!entry) {
    return (
      <Card className="space-y-4 border-dashed text-slate-500">
        <p>Entrada não encontrada neste navegador.</p>
        <ButtonLink href="/library" variant="secondary">
          Voltar para biblioteca
        </ButtonLink>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            Entrada salva em {formatDate(entry.created_at)}
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-normal text-slate-950">
            {entry.original_phrase}
          </h1>
        </div>
        <ButtonLink href="/library" variant="secondary">
          Voltar
        </ButtonLink>
      </div>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={entry.status} />
            <Badge>{entry.source_type}</Badge>
            <Badge>{entry.difficulty ?? "unknown"}</Badge>
            {entry.tags.map((tag) => (
              <Badge key={tag}>#{tag}</Badge>
            ))}
          </div>

          <Section title="Tradução">{entry.translation}</Section>
          <Section title="Explicação simples">{entry.meaning_explanation}</Section>
          <Section title="Contexto de uso">{entry.context_note}</Section>

          {entry.source_title || entry.source_url ? (
            <div>
              <CardTitle>Fonte</CardTitle>
              <p className="mt-2 text-slate-700">{entry.source_title}</p>
              {entry.source_url ? (
                <a
                  href={entry.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block break-all text-sm text-emerald-700 hover:underline"
                >
                  {entry.source_url}
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="border-t border-slate-100 pt-5">
            <CardTitle>Status</CardTitle>
            <div className="mt-3">
              <StatusForm entryId={entry.id} currentStatus={entry.status} />
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardTitle>Chunk principal</CardTitle>
            {mainChunk ? (
              <div className="mt-4 space-y-3">
                <p className="text-2xl font-semibold text-slate-950">
                  {mainChunk.chunk_text}
                </p>
                {mainChunk.natural_version ? (
                  <p className="text-sm text-slate-600">
                    Natural: {mainChunk.natural_version}
                  </p>
                ) : null}
                {mainChunk.casual_version ? (
                  <p className="text-sm text-slate-600">
                    Falado: {mainChunk.casual_version}
                  </p>
                ) : null}
                {mainChunk.usage_note ? (
                  <p className="text-sm text-slate-500">
                    {mainChunk.usage_note}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Nenhum chunk cadastrado para esta entrada.
              </p>
            )}
          </Card>

          <Card>
            <CardTitle>Frases próprias</CardTitle>
            <div className="mt-4 space-y-3">
              {entry.personal_sentences.length > 0 ? (
                entry.personal_sentences.map((sentence) => (
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
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Ainda falta criar sua primeira frase.
                </p>
              )}
            </div>
          </Card>
        </div>
      </section>

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
  if (!children) {
    return null;
  }

  return (
    <div>
      <CardTitle>{title}</CardTitle>
      <p className="mt-2 whitespace-pre-wrap text-slate-700">{children}</p>
    </div>
  );
}

