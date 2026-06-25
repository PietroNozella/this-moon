"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { ReviewItem } from "@/components/review/review-item";
import { createClient } from "@/lib/supabase/client";
import type { ChunkRow, EntryRow, ReviewRow } from "@/types/database";

type DueReview = ReviewRow & {
  entry?: EntryRow | null;
  chunk?: ChunkRow | null;
};

export default function ReviewPage() {
  const [reviews, setReviews] = useState<DueReview[]>([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const now = new Date().toISOString();
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());

      const [{ data: dueReviews }, { data: dailyGoals }] =
        await Promise.all([
          supabase
            .from("reviews")
            .select("*")
            .lte("due_at", now)
            .order("due_at", { ascending: true }),
          supabase
            .from("daily_goals")
            .select("reviews_completed")
            .eq("goal_date", today)
            .single(),
        ]);

      const entryIds = [
        ...new Set((dueReviews ?? []).map((r) => r.entry_id).filter(Boolean)),
      ];
      const chunkIds = [
        ...new Set((dueReviews ?? []).map((r) => r.chunk_id).filter(Boolean)),
      ];

      const [entriesResult, chunksResult] = await Promise.all([
        entryIds.length > 0
          ? supabase
              .from("learning_entries")
              .select("*")
              .in("id", entryIds as string[])
          : Promise.resolve({ data: [] }),
        chunkIds.length > 0
          ? supabase
              .from("chunks")
              .select("*")
              .in("id", chunkIds as string[])
          : Promise.resolve({ data: [] }),
      ]);

      const entryMap = new Map(
        (entriesResult.data ?? []).map((e) => [e.id, e as EntryRow]),
      );
      const chunkMap = new Map(
        (chunksResult.data ?? []).map((c) => [c.id, c as ChunkRow]),
      );

      const merged: DueReview[] = (dueReviews ?? []).map((review) => ({
        ...(review as ReviewRow),
        entry: review.entry_id ? entryMap.get(review.entry_id) ?? null : null,
        chunk: review.chunk_id ? chunkMap.get(review.chunk_id) ?? null : null,
      }));

      setReviews(merged);
      setCompletedToday(dailyGoals?.reviews_completed ?? 0);
      setLoading(false);
    }

    void load();
  }, []);

  if (loading) {
    return <Card className="text-slate-500">Carregando revisões...</Card>;
  }

  const emptyMessage =
    completedToday > 0
      ? "Você concluiu as revisões de hoje."
      : "Nenhuma revisão pendente. Capture frases para começar.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Revisão</p>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Revisões pendentes
          </h1>
        </div>
      </div>

      <div className="grid gap-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))
        ) : (
          <Card className="border-dashed text-center text-slate-500">
            {emptyMessage}
          </Card>
        )}
      </div>
    </div>
  );
}
