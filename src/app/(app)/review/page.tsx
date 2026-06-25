"use client";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReviewItem } from "@/components/review/review-item";
import { useLocalStore } from "@/components/local-store-provider";
import { getDueReviews } from "@/lib/local-selectors";

export default function ReviewPage() {
  const { state, isLoaded } = useLocalStore();
  const reviews = getDueReviews(state);

  if (!isLoaded) {
    return <Card className="text-slate-500">Carregando revisoes...</Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Review</p>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Revisoes pendentes
          </h1>
        </div>
        <ButtonLink href="/capture" variant="secondary">
          Capturar frase
        </ButtonLink>
      </div>

      <div className="grid gap-4">
        {reviews.length > 0 ? (
          reviews.map((review) => <ReviewItem key={review.id} review={review} />)
        ) : (
          <Card className="border-dashed text-center text-slate-500">
            Nenhuma revisao pendente. Bom trabalho.
          </Card>
        )}
      </div>
    </div>
  );
}
