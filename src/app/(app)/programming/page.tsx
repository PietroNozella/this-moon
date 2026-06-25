"use client";

import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { ChunkRow, EntryRow } from "@/types/database";

const basePhrases = [
  "Let me check the code.",
  "I found a bug.",
  "It depends on the implementation.",
  "The database query is slow.",
];

export default function ProgrammingPage() {
  const [chunks, setChunks] = useState<ChunkRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: rawEntries } = await supabase
        .from("learning_entries")
        .select("id")
        .eq("source_type", "programming");

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
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Programação</p>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Inglês técnico
          </h1>
        </div>
        <ButtonLink href="/capture">Capturar frase</ButtonLink>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>Frases úteis</CardTitle>
          <div className="mt-4 space-y-2">
            {basePhrases.map((phrase) => (
              <p key={phrase} className="rounded-md bg-slate-50 px-3 py-2">
                {phrase}
              </p>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Chunks capturados</CardTitle>
          <div className="mt-4 space-y-2">
            {loading ? (
              <p className="text-sm text-slate-500">Carregando...</p>
            ) : chunks.length > 0 ? (
              chunks.map((chunk) => (
                <p key={chunk.id} className="rounded-md bg-slate-50 px-3 py-2">
                  {chunk.chunk_text}
                </p>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Capture frases de debug, deploy, database, frontend ou backend.
              </p>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
