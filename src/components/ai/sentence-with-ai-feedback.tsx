"use client";

import { useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AILoadingState } from "@/components/ai/ai-loading-state";
import { AIErrorState } from "@/components/ai/ai-error-state";
import { generateSentenceFeedback } from "@/server/actions/ai";
import type { PersonalSentenceRow } from "@/types/database";
import type { sentenceFeedbackSchema } from "@/lib/ai/schemas";
import type { z } from "zod";

type FeedbackData = z.infer<typeof sentenceFeedbackSchema>;

export function SentenceWithAIFeedback({
  sentence,
  showTranslation,
}: {
  sentence: PersonalSentenceRow;
  showTranslation?: boolean;
}) {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alreadyCorrected = sentence.corrected_sentence || sentence.natural_sentence;
  const showFeedback = feedback || alreadyCorrected;

  async function handleCorrect() {
    if (feedback) return;
    setLoading(true);
    setError(null);

    const result = await generateSentenceFeedback({
      sentenceId: sentence.id,
      sentence: sentence.sentence,
      relatedEntryId: sentence.entry_id ?? undefined,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setFeedback(result.data);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-6 text-slate-950">
            {sentence.sentence}
          </p>
          {showTranslation && sentence.translation ? (
            <p className="mt-1 text-sm italic leading-6 text-slate-500">
              {sentence.translation}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={loading || !!feedback}
          onClick={handleCorrect}
          className={`shrink-0 gap-1.5 ${
            alreadyCorrected || feedback
              ? "text-emerald-600"
              : "text-candy-blue-700 hover:text-candy-blue-950"
          }`}
        >
          {alreadyCorrected || feedback ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {feedback
            ? "Corrigido"
            : alreadyCorrected
              ? "Corrigido"
              : "Corrigir"}
        </Button>
      </div>

      {loading ? <AILoadingState className="mt-3" /> : null}
      {error ? <AIErrorState message={error} onRetry={handleCorrect} className="mt-3" /> : null}

      {showFeedback ? (
        <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
          {feedback?.correctedSentence ?? sentence.corrected_sentence ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Correção
              </p>
              <p className="mt-0.5 text-sm leading-6 text-slate-900">
                {feedback?.correctedSentence ?? sentence.corrected_sentence}
              </p>
            </div>
          ) : null}

          {feedback?.naturalSentence ?? sentence.natural_sentence ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Versão natural
              </p>
              <p className="mt-0.5 text-sm italic leading-6 text-slate-600">
                {feedback?.naturalSentence ?? sentence.natural_sentence}
              </p>
            </div>
          ) : null}

          {feedback?.feedbackPtBr ?? sentence.ai_feedback ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Feedback
              </p>
              <p className="mt-0.5 text-sm leading-6 text-slate-700">
                {feedback?.feedbackPtBr ?? sentence.ai_feedback}
              </p>
            </div>
          ) : null}

          {feedback?.pronunciationTip ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pronúncia
              </p>
              <p className="mt-0.5 text-sm leading-6 text-slate-700">
                {feedback.pronunciationTip}
              </p>
            </div>
          ) : null}

          {feedback?.examples && feedback.examples.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Exemplos
              </p>
              <ul className="mt-1 space-y-1">
                {feedback.examples.map((ex, i) => (
                  <li key={i} className="text-sm leading-6 text-slate-600">
                    • {ex}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
