"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label, Textarea } from "@/components/ui/form";
import { completeReview } from "@/server/actions/learning";
import type { ChunkRow, EntryRow, ReviewRow } from "@/types/database";

type DueReview = ReviewRow & {
  entry?: EntryRow | null;
  chunk?: ChunkRow | null;
};

const ratingLabels = {
  forgot: "Esqueci",
  hard: "Difícil",
  good: "Bom",
  easy: "Fácil",
};

const reviewTypeLabels: Record<string, string> = {
  frase_propria: "Frase própria",
};

export function ReviewItem({ review }: { review: DueReview }) {
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const prompt =
    review.prompt ??
    review.chunk?.chunk_text ??
    review.entry?.original_phrase ??
    "Crie uma frase própria.";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const rating = String(formData.get("rating") ?? "good");

    if (!answer.trim()) {
      setError("Registre sua resposta.");
      return;
    }

    await completeReview(review.id, answer.trim(), rating);
    setAnswer("");
    setError("");
    setDone(true);
  }

  if (done) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <p className="text-sm font-medium text-emerald-700">
          Revisão concluída!
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-sm font-medium text-emerald-700">
          {reviewTypeLabels[review.review_type] ?? review.review_type}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">{prompt}</h2>
        {review.entry?.translation ? (
          <p className="mt-1 text-sm text-slate-500">
            {review.entry.translation}
          </p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`answer-${review.id}`}>Sua resposta</Label>
          <Textarea
            id={`answer-${review.id}`}
            name="answer"
            placeholder="Escreva sua resposta."
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            className="min-h-[72px]"
            required
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(ratingLabels).map(([rating, label]) => (
            <Button
              key={rating}
              type="submit"
              name="rating"
              value={rating}
              variant={rating === "good" ? "primary" : "secondary"}
              className="px-3 py-1.5 text-sm"
              size="sm"
            >
              {label}
            </Button>
          ))}
        </div>
      </form>
    </Card>
  );
}
