"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { EnrichmentData } from "@/server/actions/enrich";
import type { AiFeedbackRow } from "@/types/database";

type FeedbackRow = AiFeedbackRow & {
  output_json: EnrichmentData;
};

export function EntryEnrichment({ entryId }: { entryId: string }) {
  const [data, setData] = useState<EnrichmentData | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: feedback } = await supabase
        .from("ai_feedbacks")
        .select("output_json")
        .eq("entry_id", entryId)
        .eq("feedback_type", "enrichment")
        .maybeSingle();

      if (feedback) {
        setData((feedback as FeedbackRow).output_json);
      }
    }

    void load();
  }, [entryId]);

  if (!data) return null;

  const hasVerbs = data.verbs && data.verbs.length > 0;
  const hasVariations = data.variations && (data.variations.past || data.variations.negative || data.variations.question);
  const hasContexts = data.usage_contexts && data.usage_contexts.length > 0;

  if (!hasVerbs && !hasVariations && !hasContexts) return null;

  return (
    <div className="space-y-6">
      {hasVerbs ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Verbos na frase</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.verbs.map((v, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm">
                <span className="font-medium text-slate-950">{v.base}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 italic">{v.tense}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {hasContexts ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Onde usar</p>
          <ul className="mt-4 space-y-2">
            {data.usage_contexts.map((ctx, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-6 text-slate-600 before:mt-2 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-slate-300">
                {ctx}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasVariations ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Variações</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {data.variations.past ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Passado</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{data.variations.past}</p>
              </div>
            ) : null}
            {data.variations.negative ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Negativa</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{data.variations.negative}</p>
              </div>
            ) : null}
            {data.variations.question ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Pergunta</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{data.variations.question}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
