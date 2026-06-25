"use client";

import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { ChunkRow, EntryRow } from "@/types/database";

export default function MusicPage() {
  const [chunks, setChunks] = useState<ChunkRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: rawEntries } = await supabase
        .from("learning_entries")
        .select("id")
        .eq("source_type", "music");

      const entryIds = ((rawEntries ?? []) as Pick<EntryRow, "id">[]).map(
        (e) => e.id,
      );

      if (entryIds.length > 0) {
        const { data: chunksData } = await supabase
          .from("chunks")
          .select("*")
          .in("entry_id", entryIds)
          .order("created_at", { ascending: false })
          .limit(12);

        setChunks((chunksData as ChunkRow[]) ?? []);
      }

      setLoading(false);
    }

    void load();
  }, []);

  return (
    <SourcePage
      eyebrow="Música"
      title="Músicas"
      description="1 trecho pequeno, 1 chunk útil, 3 frases suas."
      empty="Escolha uma música e salve um trecho pequeno."
      chunks={chunks}
      loading={loading}
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
  loading,
  captureHref,
}: {
  eyebrow: string;
  title: string;
  description: string;
  empty: string;
  chunks: ChunkRow[];
  loading: boolean;
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
        {loading ? (
          <Card className="text-slate-500">Carregando...</Card>
        ) : chunks.length > 0 ? (
          chunks.map((chunk) => (
            <Card key={chunk.id}>
              <p className="text-base font-semibold text-slate-950">
                {chunk.chunk_text}
              </p>
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
