"use client";

import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useLocalStore } from "@/components/local-store-provider";
import { getChunksBySource } from "@/lib/local-selectors";
import type { LocalChunk } from "@/types/local";

export default function MusicPage() {
  const { state } = useLocalStore();
  const chunks = getChunksBySource(state, "music");

  return (
    <SourcePage
      eyebrow="Music"
      title="Musicas"
      description="1 trecho pequeno, 1 chunk util, 3 frases suas."
      empty="Escolha uma musica e salve um trecho pequeno."
      chunks={chunks}
      captureHref="/capture"
    />
  );
}

function SourcePage({
  eyebrow,
  title,
  description,
  empty,
  chunks,
  captureHref,
}: {
  eyebrow: string;
  title: string;
  description: string;
  empty: string;
  chunks: LocalChunk[];
  captureHref: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-700">{eyebrow}</p>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            {title}
          </h1>
          <p className="mt-2 text-slate-500">{description}</p>
        </div>
        <ButtonLink href={captureHref}>Capturar trecho</ButtonLink>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {chunks.length > 0 ? (
          chunks.map((chunk) => (
            <Card key={chunk.id}>
              <CardTitle>{chunk.chunk_text}</CardTitle>
              {chunk.translation ? (
                <p className="mt-2 text-sm text-slate-500">
                  {chunk.translation}
                </p>
              ) : null}
            </Card>
          ))
        ) : (
          <Card className="border-dashed text-slate-500">{empty}</Card>
        )}
      </section>
    </div>
  );
}
