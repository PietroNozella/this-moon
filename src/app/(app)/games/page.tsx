"use client";

import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useLocalStore } from "@/components/local-store-provider";
import { getChunksBySource } from "@/lib/local-selectors";

const basePhrases = [
  "I need more gold.",
  "I am farming mobs.",
  "I need to upgrade my gear.",
  "I got a rare item.",
];

export default function GamesPage() {
  const { state } = useLocalStore();
  const chunks = getChunksBySource(state, "game");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Jogos</p>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Inglês de jogo
          </h1>
        </div>
        <ButtonLink href="/capture">Capturar frase</ButtonLink>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>Frases base</CardTitle>
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
            {chunks.length > 0 ? (
              chunks.map((chunk) => (
                <p key={chunk.id} className="rounded-md bg-slate-50 px-3 py-2">
                  {chunk.chunk_text}
                </p>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Capture frases de loot, farm, boss, party ou trade.
              </p>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

