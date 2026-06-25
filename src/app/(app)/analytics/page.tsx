"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { useLocalStore } from "@/components/local-store-provider";
import { getDashboardData } from "@/lib/local-selectors";

export default function AnalyticsPage() {
  const { state, isLoaded } = useLocalStore();
  const data = getDashboardData(state);

  const metrics = [
    ["Frases capturadas", data.entriesCount],
    ["Frases próprias", data.personalSentencesCount],
    ["Revisões feitas", data.completedReviewsCount],
    ["Sessões de prática", data.practiceSessionsCount],
    ["Chunks ativos", data.activeChunksCount],
    ["Chunks dominados", data.masteredChunksCount],
  ];

  if (!isLoaded) {
    return <Card className="text-slate-500">Carregando progresso...</Card>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Análises</p>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          Progresso
        </h1>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map(([label, value]) => (
          <Card key={label}>
            <CardTitle>{label}</CardTitle>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}

