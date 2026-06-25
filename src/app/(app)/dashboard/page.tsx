"use client";

import { useEffect, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/utils";
import { completeSpeakingPractice } from "@/server/actions/learning";
import type { DailyGoalRow } from "@/types/database";

type DashboardData = {
  entriesCount: number;
  verbsCount: number;
  personalSentencesCount: number;
  masteredChunksCount: number;
  dailyGoal: {
    captured_entries: number;
    captured_verbs: number;
    personal_sentences_created: number;
    speaking_practices: number;
  };
};

const emptyData: DashboardData = {
  entriesCount: 0,
  verbsCount: 0,
  personalSentencesCount: 0,
  masteredChunksCount: 0,
  dailyGoal: {
    captured_entries: 0,
    captured_verbs: 0,
    personal_sentences_created: 0,
    speaking_practices: 0,
  },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [speakingPending, setSpeakingPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const today = todayISO();

      const [entriesRes, verbsRes, sentencesRes, masteredRes, goalRes] =
        await Promise.all([
          supabase
            .from("learning_entries")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("learning_entries")
            .select("*", { count: "exact", head: true })
            .eq("entry_type", "verb"),
          supabase
            .from("personal_sentences")
            .select("*", { count: "exact", head: true }),
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
      const verbsCount = verbsRes.count ?? 0;
      const personalSentencesCount = sentencesRes.count ?? 0;
      const masteredCount = masteredRes.count ?? 0;
      const dailyGoals = goalRes.data as DailyGoalRow | null;

      const dailyGoal = {
        captured_entries: dailyGoals?.captured_entries ?? 0,
        captured_verbs: dailyGoals?.captured_verbs ?? 0,
        personal_sentences_created: dailyGoals?.personal_sentences_created ?? 0,
        speaking_practices: dailyGoals?.speaking_practices ?? 0,
      };

      setData({
        entriesCount: entriesCount ?? 0,
        verbsCount,
        personalSentencesCount: personalSentencesCount ?? 0,
        masteredChunksCount: masteredCount,
        dailyGoal,
      });
      setLoading(false);
    }

    void load();
  }, []);

  const verbsDone = data.dailyGoal.captured_verbs >= 2;
  const reviewDone = data.dailyGoal.personal_sentences_created >= 5;
  const dailySteps = [
    data.dailyGoal.captured_entries > 0,
    verbsDone,
    reviewDone,
    data.dailyGoal.speaking_practices > 0,
  ];
  const doneSteps = dailySteps.filter(Boolean).length;

  if (loading) {
    return <Card className="text-slate-500">Carregando seu painel...</Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-candy-blue-700">Hoje</p>
        <ButtonLink href="/capture">Capturar</ButtonLink>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">Frases</p>
          <p className="mt-2 text-3xl font-semibold text-onyx">{data.entriesCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Verbos</p>
          <p className="mt-2 text-3xl font-semibold text-onyx">{data.verbsCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Frases próprias</p>
          <p className="mt-2 text-3xl font-semibold text-onyx">
            {data.personalSentencesCount}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Dominados</p>
          <p className="mt-2 text-3xl font-semibold text-onyx">
            {data.masteredChunksCount}
          </p>
        </Card>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardTitle>Missão diária</CardTitle>
          <div className="mt-5 space-y-3">
            <ProgressRow done={data.dailyGoal.captured_entries > 0}>
              1 chunk capturado
            </ProgressRow>
            <ProgressRow done={verbsDone}>
              {verbsDone
                ? "2 verbos capturados"
                : `${data.dailyGoal.captured_verbs}/2 verbos capturados`}
            </ProgressRow>
            <ProgressRow done={reviewDone}>
              {reviewDone
                ? "5 frases próprias"
                : `${data.dailyGoal.personal_sentences_created}/5 frases próprias`}
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
                    className="rounded bg-candy-blue-500/20 px-2 py-0.5 text-xs font-medium text-candy-blue-700 hover:bg-candy-blue-500/30 disabled:opacity-50"
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
        className={`mt-1 size-3 rounded-full ${done ? "bg-candy-blue-500" : "bg-slate-300"}`}
      />
      <span className={done ? "text-onyx" : "text-slate-500"}>
        {children}
      </span>
    </div>
  );
}
