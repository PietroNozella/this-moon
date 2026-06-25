"use client";

import { useEffect, useState } from "react";

import { Card, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

type Metrics = [string, number][];

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<Metrics>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [
        { count: entriesCount },
        { count: personalSentencesCount },
        { data: allReviews },
        { data: allChunks },
      ] = await Promise.all([
        supabase
          .from("learning_entries")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("personal_sentences")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("reviews")
          .select("*")
          .not("reviewed_at", "is", null),
        supabase.from("chunks").select("*").returns<{ status: string | null }[]>(),
      ]);

      setMetrics([
        ["Frases capturadas", entriesCount ?? 0],
        ["Frases próprias", personalSentencesCount ?? 0],
        ["Revisões feitas", allReviews?.length ?? 0],
        ["Sessões de prática", 0],
        [
          "Chunks ativos",
          allChunks?.filter((c) =>
            ["new", "learning", "practicing", "almost_natural"].includes(
              c.status ?? "",
            ),
          ).length ?? 0,
        ],
        [
          "Chunks dominados",
          allChunks?.filter((c) => c.status === "mastered").length ?? 0,
        ],
      ]);
      setLoading(false);
    }

    void load();
  }, []);

  if (loading) {
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
