"use client";

import { useEffect, useState } from "react";

import { ChevronDown } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { EnrichmentData, VerbDetail } from "@/server/actions/enrich";
import type { AiFeedbackRow } from "@/types/database";
import { cn } from "@/lib/utils";

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
  const hasVerbDetails = data.verb_details && data.verb_details.length > 0;

  if (!hasVerbs && !hasVariations && !hasContexts && !hasVerbDetails) return null;

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

      {hasVerbDetails ? (
        <VerbConjugationSection details={data.verb_details!} />
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

const tenseLabel: Record<string, string> = {
  simple: "Simple",
  continuous: "Contínuo",
  perfect: "Perfeito",
};

const periodLabel: Record<string, string> = {
  present: "Presente",
  past: "Passado",
  future: "Futuro",
};

function VerbConjugationCard({ detail }: { detail: VerbDetail }) {
  const periods = ["present", "past", "future"] as const;
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Conjugações</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{detail.base}</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", expanded && "rotate-180")} />
      </button>

      {detail.common_tenses && detail.common_tenses.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {detail.common_tenses.map((t) => (
            <span key={t} className="rounded-full border border-candy-blue-500/40 bg-candy-blue-500/15 px-2.5 py-0.5 text-xs text-candy-blue-950">
              {t}
            </span>
          ))}
        </div>
      ) : null}

      {expanded ? (
        <div className="mt-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {periods.map((period) => {
              const conj = detail.conjugations[period];
              return (
                <div key={period} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{periodLabel[period]}</p>
                  <div className="mt-3 space-y-2.5">
                    {(["simple", "continuous", "perfect"] as const).map((type) => (
                      <div key={type}>
                        <p className="text-xs text-slate-400">{tenseLabel[type]}</p>
                        <p className="text-sm font-medium text-slate-900">{conj[type] || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {detail.examples && detail.examples.length > 0 ? (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Exemplos</p>
              <div className="space-y-2">
                {detail.examples.map((ex, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="shrink-0 rounded-full bg-candy-blue-500/15 px-2 py-0.5 text-xs font-medium text-candy-blue-950">
                      {ex.tense}
                    </span>
                    <p className="text-sm leading-6 text-slate-700">{ex.example}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function VerbConjugationSection({ details }: { details: VerbDetail[] }) {
  if (details.length === 1) {
    return <VerbConjugationCard detail={details[0]} />;
  }

  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-3">
      {details.map((detail, i) => (
        <details
          key={detail.base}
          open={openIndex === i}
          className="group rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70"
        >
          <summary
            onClick={(e) => {
              e.preventDefault();
              setOpenIndex(openIndex === i ? -1 : i);
            }}
            className="flex cursor-pointer items-center justify-between px-6 py-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 transition-colors hover:text-slate-950 [&::-webkit-details-marker]:hidden"
          >
            <span className="flex items-center gap-3">
              Conjugações
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 normal-case">
                {detail.base}
              </span>
            </span>
            <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", openIndex === i && "rotate-180")} />
          </summary>
          <div className="border-t border-slate-100 px-6 pb-6 pt-4">
            <VerbConjugationCard detail={detail} />
          </div>
        </details>
      ))}
    </div>
  );
}
