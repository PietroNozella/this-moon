"use client";

import { useEffect, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge, TypeBadge } from "@/components/ui/badge";
import { AILoadingState } from "@/components/ai/ai-loading-state";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/utils";
import { generateReviewPlan } from "@/server/actions/ai";
import { Sparkles } from "lucide-react";
import type { EntryRow } from "@/types/database";

const PAGE_SIZE = 5;
const GOAL = 3;

export default function ReviewPage() {
  const [entries, setEntries] = useState<(EntryRow & { status?: string | null })[]>([]);
  const [sentencesToday, setSentencesToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      setLoading(true);
      const today = todayISO();

      const [countRes, { data: allEntries }, { data: goal }] =
        await Promise.all([
          supabase.from("learning_entries").select("*", { count: "exact", head: true }),
          supabase
            .from("learning_entries")
            .select("id, original_phrase, translation, entry_type, status")
            .order("created_at", { ascending: false })
            .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
          supabase
            .from("daily_goals")
            .select("personal_sentences_created")
            .eq("goal_date", today)
            .single(),
        ]);

      const total = countRes.count ?? 0;
      setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
      setEntries((allEntries ?? []) as (EntryRow & { status?: string | null })[]);
      setSentencesToday(goal?.personal_sentences_created ?? 0);
      setLoading(false);
    }

    void load();
  }, [page]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-32 animate-pulse rounded-3xl bg-slate-200" />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="h-44 animate-pulse rounded-3xl bg-slate-200" />
          <div className="h-44 animate-pulse rounded-3xl bg-slate-200" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const done = sentencesToday >= GOAL;
  const progress = Math.min(sentencesToday / GOAL, 1);

  const prompts = [
    "Transforme chunks em frases suas.",
    "Use isso em jogo, rotina ou programação.",
    "Não precisa ser perfeita. Precisa ser sua.",
  ];

  const verbPrompts = [
    "Crie 3 frases com um verbo usando padrões diferentes.",
    "Varie entre afirmativa, negativa e pergunta.",
    "Depois use um conector (because, so, but) para aumentar a frase.",
  ];

  const [reviewPlan, setReviewPlan] = useState<{
    reviewTitle: string;
    entries: Array<{ id: string; reason: string; task: string }>;
  } | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  async function handleReviewPlan() {
    setReviewLoading(true);
    setReviewError(null);
    setReviewPlan(null);
    const result = await generateReviewPlan();
    setReviewLoading(false);
    if (result.success) {
      setReviewPlan(result.data);
    } else {
      setReviewError(result.error);
    }
  }

  function getPrompt(entry: EntryRow & { status?: string | null }) {
    if (entry.entry_type === "verb") {
      return "Crie 3 frases com este verbo usando padrões diferentes.";
    }
    return "Crie uma frase parecida com este chunk.";
  }

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Revisão
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Crie frases próprias e fortaleça os chunks que você já salvou.
        </p>
      </header>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/[0.02]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Frases próprias hoje
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {done
                ? "Você já criou 3 frases próprias hoje!"
                : `${sentencesToday} de ${GOAL} frases criadas.`}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            {Math.round(progress * 100)}%
          </span>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-onyx transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="mt-4 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {done ? "Meta concluída: 3/3 frases" : `${sentencesToday}/${GOAL} frases`}
          </span>
          <span>Use jogo, rotina ou programação como contexto.</span>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/[0.02]">
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Inspiração
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Use estes lembretes para criar frases mais úteis.
            </p>
          </div>

          <div className="space-y-3">
            {prompts.map((prompt) => (
              <div
                key={prompt}
                className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-candy-blue-500" />
                <p className="text-sm leading-6 text-slate-600">{prompt}</p>
              </div>
            ))}
            <div className="mt-3 rounded-2xl border border-candy-blue-500/30 bg-candy-blue-500/10 p-4">
              <div className="flex gap-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-candy-blue-700" />
                <div>
                  <p className="text-sm font-medium text-candy-blue-950">Verbos</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Crie 3 frases com um verbo usando padrões diferentes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/[0.02]">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Próxima ação
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Escolha um chunk salvo e crie uma frase simples com ele.
          </p>
          <div className="mt-5">
            <a
              href="/library"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-onyx px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              Escolher chunk
            </a>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/[0.02]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                Plano de revisão
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                IA analisa seu progresso e sugere o que revisar.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={reviewLoading}
              onClick={handleReviewPlan}
              className="shrink-0 gap-1.5 text-candy-blue-700 hover:text-candy-blue-950"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Gerar plano
            </Button>
          </div>

          {reviewLoading ? <AILoadingState className="mt-4" /> : null}
          {reviewError ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{reviewError}</p>
            </div>
          ) : null}

          {reviewPlan ? (
            <div className="mt-5 space-y-3">
              <p className="text-sm font-medium text-candy-blue-950">{reviewPlan.reviewTitle}</p>
              {reviewPlan.entries.slice(0, 5).map((item, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-medium text-onyx">{item.task}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.reason}</p>
                  <ButtonLink href={`/library/${item.id}`} variant="ghost" size="sm" className="mt-1">
                    Ir para o chunk
                  </ButtonLink>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {entries.length > 0 ? (
        <div className="space-y-4">
          {entries.map((entry) => (
            <a
              key={entry.id}
              href={`/library/${entry.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge value={entry.entry_type} />
                {entry.status ? <StatusBadge value={entry.status} /> : null}
              </div>
              <p className="mt-3 text-lg font-medium text-onyx">
                {entry.original_phrase}
              </p>
              {entry.translation ? (
                <p className="mt-1 text-sm italic text-slate-500">
                  {entry.translation}
                </p>
              ) : null}
              <div className="mt-3 flex gap-2">
                <ButtonLink
                  href={`/library/${entry.id}`}
                  variant="secondary"
                  size="sm"
                >
                  {entry.entry_type === "verb" ? "Criar frases" : "Criar frase"}
                </ButtonLink>
                {entry.entry_type === "chunk" ? (
                  <ButtonLink href="/speaking" variant="ghost" size="sm">
                    Speaking
                  </ButtonLink>
                ) : null}
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-base font-semibold text-slate-900">
            Nada aqui ainda
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Capture uma frase real para começar a criar frases suas.
          </p>
          <ButtonLink href="/capture" variant="primary" className="mt-6">
            Capturar chunk
          </ButtonLink>
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
