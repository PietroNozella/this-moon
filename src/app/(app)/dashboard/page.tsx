"use client";

import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/ui/button";
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

const panelClass =
  "!border-candy-blue-500/15 !bg-[#061013] shadow-sm shadow-black/30";
const softPanelClass =
  "!border-candy-blue-500/15 !bg-[#081922] shadow-sm shadow-black/25";
const panelTextClass = "text-candy-blue-500/65";
const quickActionClass =
  "justify-start !border-candy-blue-500/15 !bg-candy-blue-500/5 text-candy-blue-500 hover:!bg-candy-blue-500/10";

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
  const progressPercent = Math.round((doneSteps / dailySteps.length) * 100);

  const stats = [
    { label: "Frases", value: data.entriesCount },
    { label: "Verbos", value: data.verbsCount },
    { label: "Frases pr\u00f3prias", value: data.personalSentencesCount },
    { label: "Dominados", value: data.masteredChunksCount },
  ];

  if (loading) {
    return (
      <Card className={`${panelClass} ${panelTextClass}`}>
        Carregando seu painel...
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-candy-blue-500/70">Hoje</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-candy-blue-500">
            {"Painel di\u00e1rio"}
          </h1>
        </div>
        <ButtonLink
          href="/capture"
          className="!bg-candy-blue-500 text-onyx hover:!bg-candy-blue-500/90"
        >
          Capturar
        </ButtonLink>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className={softPanelClass}>
            <p className={panelTextClass}>{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-candy-blue-500">
              {stat.value}
            </p>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className={panelClass}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-candy-blue-500">
                {"Miss\u00e3o di\u00e1ria"}
              </CardTitle>
              <p className={`mt-1 text-sm ${panelTextClass}`}>
                {doneSteps}/4 {"conclu\u00eddo"}
              </p>
            </div>
            <span className="rounded-md border border-candy-blue-500/15 bg-candy-blue-500/10 px-2.5 py-1 text-sm font-semibold text-candy-blue-500">
              {progressPercent}%
            </span>
          </div>

          <div className="mt-5 h-2 rounded-full bg-candy-blue-500/10">
            <div
              className="h-full rounded-full bg-candy-blue-500 transition-all"
              style={{ width: `${progressPercent}%` }}
              aria-label={`${progressPercent}% da missao diaria concluida`}
            />
          </div>

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
                ? "5 frases pr\u00f3prias"
                : `${data.dailyGoal.personal_sentences_created}/5 frases pr\u00f3prias`}
            </ProgressRow>
            <ProgressRow done={data.dailyGoal.speaking_practices > 0}>
              {data.dailyGoal.speaking_practices > 0 ? (
                "1 frase falada"
              ) : (
                <span className="flex flex-wrap items-center gap-2">
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
                    className="rounded-md bg-candy-blue-500/15 px-2 py-1 text-xs font-medium text-candy-blue-500 hover:bg-candy-blue-500/25 disabled:opacity-50"
                  >
                    {speakingPending ? "..." : "Falar agora"}
                  </button>
                </span>
              )}
            </ProgressRow>
          </div>
        </Card>

        <Card className={panelClass}>
          <CardTitle className="text-candy-blue-500">
            {"A\u00e7\u00f5es r\u00e1pidas"}
          </CardTitle>
          <div className="mt-4 grid gap-2">
            <ButtonLink href="/review" variant="secondary" className={quickActionClass}>
              Revisar hoje
            </ButtonLink>
            <ButtonLink href="/capture" variant="secondary" className={quickActionClass}>
              Capturar nova frase
            </ButtonLink>
            <ButtonLink href="/library" variant="secondary" className={quickActionClass}>
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
        className={`mt-1.5 size-3 rounded-full ${
          done
            ? "bg-candy-blue-500 shadow-sm shadow-candy-blue-500/40"
            : "border border-candy-blue-500/30 bg-transparent"
        }`}
      />
      <span className={done ? "text-candy-blue-500" : panelTextClass}>
        {children}
      </span>
    </div>
  );
}
