"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { AILoadingState } from "@/components/ai/ai-loading-state";
import { generateDailyCoach } from "@/server/actions/ai";

type CoachData = {
  title: string;
  reason: string;
  nextAction: { label: string; href: string };
  microMission: string[];
  suggestedEntries: string[];
};

export function AICoachCard() {
  const [data, setData] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const result = await generateDailyCoach();
    if (result.success) {
      setData(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/[0.02]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            AI Coach
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Recomendação inteligente com base no seu progresso
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-candy-blue-500/30 bg-candy-blue-500/10 px-2.5 py-1 text-xs font-medium text-candy-blue-950">
          <Sparkles className="h-3 w-3" />
          IA
        </span>
      </div>

      {loading ? (
        <AILoadingState className="mt-4" />
      ) : error ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-500">
            Não foi possível carregar a recomendação.
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={load}>
            Tentar novamente
          </Button>
        </div>
      ) : data ? (
        <div className="mt-5 space-y-4">
          <div>
            <p className="text-base font-semibold text-slate-950">
              {data.title}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {data.reason}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Missão rápida
            </p>
            <ol className="mt-3 space-y-2">
              {data.microMission.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-onyx text-xs font-medium text-white">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <ButtonLink
            href={data.nextAction.href}
            variant="primary"
            size="sm"
            className="w-full"
          >
            {data.nextAction.label}
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
