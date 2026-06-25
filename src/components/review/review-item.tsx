"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label, Textarea } from "@/components/ui/form";
import { useLocalStore } from "@/components/local-store-provider";
import type { LocalDueReview } from "@/types/local";

const ratingLabels = {
  forgot: "Esqueci",
  hard: "Dificil",
  good: "Bom",
  easy: "Facil",
};

export function ReviewItem({ review }: { review: LocalDueReview }) {
  const { completeReview } = useLocalStore();
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const prompt =
    review.prompt ??
    review.chunk?.chunk_text ??
    review.entry?.original_phrase ??
    "Crie uma frase propria.";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const rating = String(formData.get("rating") ?? "good");

    if (!answer.trim()) {
      setError("Registre sua resposta.");
      return;
    }

    completeReview(review.id, answer.trim(), rating);
    setAnswer("");
    setError("");
  }

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase text-emerald-700">
          {review.review_type}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">{prompt}</h2>
        {review.entry?.translation ? (
          <p className="mt-2 text-sm text-slate-500">
            {review.entry.translation}
          </p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`answer-${review.id}`}>Sua resposta ativa</Label>
          <Textarea
            id={`answer-${review.id}`}
            name="answer"
            placeholder="Escreva ou registre o que voce falou em voz alta."
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            required
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-4">
          {Object.entries(ratingLabels).map(([rating, label]) => (
            <Button
              key={rating}
              type="submit"
              name="rating"
              value={rating}
              variant={rating === "good" ? "primary" : "secondary"}
            >
              {label}
            </Button>
          ))}
        </div>
      </form>
    </Card>
  );
}
