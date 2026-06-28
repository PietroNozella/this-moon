"use client";

import { useEffect, useState } from "react";

import { ReviewItem } from "@/components/review/review-item";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/client";
import type { ChunkRow, EntryRow, ReviewRow } from "@/types/database";

type DueReview = ReviewRow & {
  entry?: EntryRow | null;
  chunk?: ChunkRow | null;
};

export default function ReviewPage() {
  const [reviews, setReviews] = useState<DueReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("reviews")
        .select("*, entry:entry_id(*), chunk:chunk_id(*)")
        .lte("due_at", new Date().toISOString())
        .order("due_at", { ascending: true })
        .limit(20);

      setReviews((data ?? []) as unknown as DueReview[]);
      setLoading(false);
    }

    void load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-48 animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  if (reviews.length === 0 || done) {
    return (
      <div className="max-w-4xl space-y-6">
        <PageHeader
          title="Revisar"
          subtitle="Pratique frases que precisam voltar hoje."
        />
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/70">
          <p className="text-base font-semibold text-slate-950">
            {done ? "Revisão concluída!" : "Nada para revisar hoje."}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {done
              ? "Volte amanhã para mais revisões."
              : "Capture novas frases para começar a revisar."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Revisar"
        subtitle="Pratique frases que precisam voltar hoje."
      />

      <p className="text-sm text-slate-500">
        {reviews.length} {reviews.length === 1 ? "revisão pendente" : "revisões pendentes"}
      </p>

      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewItem
            key={review.id}
            review={review}
            onComplete={() => {
              if (reviews.length <= 1) setDone(true);
            }}
          />
        ))}
      </div>
    </div>
  );
}
