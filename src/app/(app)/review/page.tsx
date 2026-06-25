"use client";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReviewItem } from "@/components/review/review-item";
import { useLocalStore } from "@/components/local-store-provider";
import { getDashboardData } from "@/lib/local-selectors";

export default function ReviewPage() {
  const { state, isLoaded } = useLocalStore();
  const data = getDashboardData(state);
  const reviews = data.dueReviews;

  if (!isLoaded) {
    return <Card className="text-slate-500">Carregando revisões...</Card>;
  }

  const emptyMessage =
    state.reviews.length === 0
      ? "Sua primeira revisão aparece quando você salvar uma frase."
      : data.dailyGoal.reviews_completed > 0
        ? "Você já concluiu as revisões disponíveis de hoje."
        : "Nenhuma revisão vencida agora. As próximas aparecem aqui quando chegar a hora.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Revisão</p>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Revisões pendentes
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
            {emptyMessage}
          </Card>
        )}
      </div>
    </div>
  );
}
