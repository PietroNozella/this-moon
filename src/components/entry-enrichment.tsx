"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { EnrichmentData, VerbDetail } from "@/server/actions/enrich";
import type { AiFeedbackRow } from "@/types/database";

type FeedbackRow = AiFeedbackRow & {
  output_json: EnrichmentData;
};

const tenseLabel: Record<string, string> = {
  simple: "Simple",
  continuous: "Continuo",
  perfect: "Perfect",
};

const periodLabel: Record<string, string> = {
  present: "Presente",
  past: "Passado",
  future: "Futuro",
};

export function EntryEnrichment({ entryId }: { entryId: string }) {
  const [data, setData] = useState<EnrichmentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      setLoading(true);
      const { data: feedback } = await supabase
        .from("ai_feedbacks")
        .select("output_json")
        .eq("entry_id", entryId)
        .eq("feedback_type", "enrichment")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setData(feedback ? (feedback as FeedbackRow).output_json : null);
      setLoading(false);
    }

    void load();
  }, [entryId]);

  const hasVerbs = !!data?.verbs?.length;
  const hasVariations = !!(data?.variations && (data.variations.past || data.variations.negative || data.variations.question));
  const hasContexts = !!data?.usage_contexts?.length;
  const hasVerbDetails = !!data?.verb_details?.length;
  const hasAnyData = hasVerbs || hasVariations || hasContexts || hasVerbDetails;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Analise da IA</p>
          <h2 className="mt-1 text-base font-semibold text-slate-950">Uso, verbos e variacoes</h2>
        </div>
        {hasVerbs ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
            {data!.verbs.length} {data!.verbs.length === 1 ? "verbo" : "verbos"}
          </span>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Carregando analise...</p>
      ) : !hasAnyData ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
          Analise ainda nao disponivel.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {hasContexts ? <UsageContexts contexts={data!.usage_contexts} /> : null}
          {hasVerbs ? <VerbChips verbs={data!.verbs} /> : null}
          {hasVerbDetails ? <VerbConjugations details={data!.verb_details!} /> : null}
          {hasVariations ? <Variations variations={data!.variations} /> : null}
        </div>
      )}
    </section>
  );
}

function UsageContexts({ contexts }: { contexts: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Onde usar</p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {contexts.map((context, index) => (
          <li key={index} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-700">
            {context}
          </li>
        ))}
      </ul>
    </div>
  );
}

function VerbChips({ verbs }: { verbs: EnrichmentData["verbs"] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Verbos no chunk</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {verbs.map((verb, index) => (
          <span key={`${verb.base}-${index}`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
            <span className="font-semibold text-slate-950">{verb.base}</span>
            <span>{verb.form}</span>
            <span className="text-slate-400">{verb.tense}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function VerbConjugations({ details }: { details: VerbDetail[] }) {
  return (
    <div className="space-y-2">
      {details.map((detail, index) => (
        <details key={`${detail.base}-${index}`} open={details.length === 1} className="group rounded-xl border border-slate-200 bg-slate-50">
          <summary className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
            <span>Tempos de {detail.base}</span>
            <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-slate-200 p-3">
            <div className="grid gap-2 md:grid-cols-3">
              {(["present", "past", "future"] as const).map((period) => {
                const conjugation = detail.conjugations[period];
                return (
                  <div key={period} className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{periodLabel[period]}</p>
                    <div className="mt-2 space-y-1.5">
                      {(["simple", "continuous", "perfect"] as const).map((type) => (
                        <p key={type} className="text-xs text-slate-600">
                          <span className="text-slate-400">{tenseLabel[type]}: </span>
                          <span className="font-medium text-slate-900">{conjugation[type] || "-"}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {detail.examples?.length ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {detail.examples.slice(0, 4).map((example, index) => (
                  <p key={index} className="rounded-lg bg-white px-3 py-2 text-xs leading-5 text-slate-600 ring-1 ring-slate-200">
                    <span className="font-medium text-slate-900">{example.tense}: </span>
                    {example.example}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}

function Variations({ variations }: { variations: EnrichmentData["variations"] }) {
  const items = [
    { label: "Passado", value: variations.past },
    { label: "Negativa", value: variations.negative },
    { label: "Pergunta", value: variations.question },
  ].filter((item) => item.value);

  if (!items.length) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Variacoes uteis</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}