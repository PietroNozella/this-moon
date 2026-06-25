"use client";

import { useEffect, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { completeSpeakingPractice } from "@/server/actions/learning";
import type { DailyGoalRow, ReviewRow } from "@/types/database";

type DashboardData = {
  entriesCount: number;
  personalSentencesCount: number;
  pendingReviewsCount: number;
  masteredChunksCount: number;
  dailyGoal: {
    captured_entries: number;
    personal_sentences_created: number;
    reviews_completed: number;
    speaking_practices: number;
  };
  reviewStep: { done: boolean; label: string };
};

const emptyData: DashboardData = {
  entriesCount: 0,
  personalSentencesCount: 0,
  pendingReviewsCount: 0,
  masteredChunksCount: 0,
  dailyGoal: {
    captured_entries: 0,
    personal_sentences_created: 0,
    reviews_completed: 0,
    speaking_practices: 0,
  },
  reviewStep: { done: true, label: "Sem revisão pendente hoje" },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [speakingPending, setSpeakingPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const now = new Date().toISOString();
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());

      const [entriesRes, sentencesRes, reviewsDueRes, masteredRes, goalRes] =
        await Promise.all([
          supabase
            .from("learning_entries")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("personal_sentences")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("reviews")
            .select("*")
            .lte("due_at", now)
            .order("due_at", { ascending: true }),
          supabase
            .from("learning_entries")
            .select("*", { count: "exact", head: true })
            .eq("status", "mastered"),
          supabase
            .from("daily_goals")
            .select("*")
            .eq("goal_date", today)
            .maybeSingle(),
        ]);

      const entriesCount = entriesRes.count ?? 0;
      const personalSentencesCount = sentencesRes.count ?? 0;
      const dueReviews = (reviewsDueRes.data ?? []) as ReviewRow[];
      const masteredCount = masteredRes.count ?? 0;
      const dailyGoals = goalRes.data as DailyGoalRow | null;

      const dailyGoal = {
        captured_entries: dailyGoals?.captured_entries ?? 0,
        personal_sentences_created: dailyGoals?.personal_sentences_created ?? 0,
        reviews_completed: dailyGoals?.reviews_completed ?? 0,
        speaking_practices: dailyGoals?.speaking_practices ?? 0,
      };

      const isDueReviewPending = (dueReviews?.length ?? 0) > 0;
      const reviewStepDone =
        dailyGoal.reviews_completed > 0 || !isDueReviewPending;

      setData({
        entriesCount: entriesCount ?? 0,
        personalSentencesCount: personalSentencesCount ?? 0,
        pendingReviewsCount: dueReviews?.length ?? 0,
        masteredChunksCount: masteredCount,
        dailyGoal,
        reviewStep: {
          done: reviewStepDone,
          label: isDueReviewPending
            ? "1 revisão rápida"
            : "Sem revisão pendente hoje",
        },
      });
      setLoading(false);
    }

    void load();
  }, []);

  const dailySteps = [
    data.dailyGoal.captured_entries > 0,
    data.dailyGoal.personal_sentences_created >= 3,
    data.reviewStep.done,
    data.dailyGoal.speaking_practices > 0,
  ];
  const doneSteps = dailySteps.filter(Boolean).length;

  if (loading) {
    return <Card className="text-slate-500">Carregando seu painel...</Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Hoje</p>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Seu laboratório de inglês
          </h1>
        </div>
        <ButtonLink href="/capture">Capturar frase</ButtonLink>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">Frases salvas</p>
          <p className="mt-2 text-3xl font-semibold">{data.entriesCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Revisões pendentes</p>
          <p className="mt-2 text-3xl font-semibold">
            {data.pendingReviewsCount}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Frases próprias</p>
          <p className="mt-2 text-3xl font-semibold">
            {data.personalSentencesCount}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Dominados</p>
          <p className="mt-2 text-3xl font-semibold">
            {data.masteredChunksCount}
          </p>
        </Card>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardTitle>Missão diária</CardTitle>
          <div className="mt-5 space-y-3">
            <ProgressRow done={data.dailyGoal.captured_entries > 0}>
              1 frase capturada
            </ProgressRow>
            <ProgressRow done={data.dailyGoal.personal_sentences_created >= 3}>
              3 frases próprias
            </ProgressRow>
            <ProgressRow done={data.reviewStep.done}>
              {data.reviewStep.label}
            </ProgressRow>
            <ProgressRow done={data.dailyGoal.speaking_practices > 0}>
              {data.dailyGoal.speaking_practices > 0 ? (
                "1 frase falada"
              ) : (
                <span className="flex items-center gap-2">
                  1 frase falada
                  <button
                    type="button"
                    disabled={speakingPending}
                    onClick={async () => {
                      setSpeakingPending(true);
                      try {
                        await completeSpeakingPractice();
                        setData((prev) => ({
                          ...prev,
                          dailyGoal: {
                            ...prev.dailyGoal,
                            speaking_practices: 1,
                          },
                        }));
                      } finally {
                        setSpeakingPending(false);
                      }
                    }}
                    className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                  >
                    {speakingPending ? "..." : "Falar agora"}
                  </button>
                </span>
              )}
            </ProgressRow>
          </div>
          <p className="mt-5 text-sm text-slate-500">{doneSteps}/4 concluído</p>
        </Card>

        <Card>
          <CardTitle>Ações rápidas</CardTitle>
          <div className="mt-4 grid gap-2">
            <ButtonLink
              href="/review"
              variant="secondary"
              className="justify-start"
            >
              Revisar hoje
            </ButtonLink>
            <ButtonLink
              href="/capture"
              variant="secondary"
              className="justify-start"
            >
              Capturar nova frase
            </ButtonLink>
            <ButtonLink
              href="/library"
              variant="secondary"
              className="justify-start"
            >
              Biblioteca
            </ButtonLink>
          </div>
        </Card>
      </section>
    </div>
  );
}

function ProgressRow({
  done,
  children,
}: {
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-1 size-3 rounded-full ${done ? "bg-emerald-500" : "bg-slate-300"}`}
      />
      <span className={done ? "text-slate-950" : "text-slate-500"}>
        {children}
      </span>
    </div>
  );
}
