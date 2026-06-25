"use client";

import { useEffect, useState } from "react";

import { DailyMissionCard } from "@/components/dashboard/daily-mission-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { NextPracticeCard } from "@/components/dashboard/next-practice-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { ButtonLink } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/utils";
import type { DailyGoalRow, EntryRow } from "@/types/database";

type DashboardData = {
  entriesCount: number;
  verbsCount: number;
  practiceCount: number;
  masteredCount: number;
  dailyGoal: {
    captured_entries: number;
    captured_verbs: number;
    personal_sentences_created: number;
    speaking_practices: number;
    listening_practices: number;
  };
  recentPhrase: string | null;
  nextEntry: EntryRow | null;
};

const emptyData: DashboardData = {
  entriesCount: 0,
  verbsCount: 0,
  practiceCount: 0,
  masteredCount: 0,
  dailyGoal: {
    captured_entries: 0,
    captured_verbs: 0,
    personal_sentences_created: 0,
    speaking_practices: 0,
    listening_practices: 0,
  },
  recentPhrase: null,
  nextEntry: null,
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const today = todayISO();

      const [entriesRes, verbsRes, sessionsRes, masteredRes, goalRes, recentRes, nextRes] =
        await Promise.all([
          supabase.from("learning_entries").select("*", { count: "exact", head: true }),
          supabase.from("learning_entries").select("*", { count: "exact", head: true }).eq("entry_type", "verb"),
          supabase.from("practice_sessions").select("*", { count: "exact", head: true }),
          supabase.from("learning_entries").select("*", { count: "exact", head: true }).eq("status", "mastered"),
          supabase.from("daily_goals").select("*").eq("goal_date", today).maybeSingle(),
          supabase.from("learning_entries").select("original_phrase").order("created_at", { ascending: false }).limit(1).maybeSingle(),
          supabase
            .from("learning_entries")
            .select("*")
            .order("times_practiced", { ascending: true })
            .order("confidence_level", { ascending: true })
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      const dailyGoals = goalRes.data as DailyGoalRow | null;

      setData({
        entriesCount: entriesRes.count ?? 0,
        verbsCount: verbsRes.count ?? 0,
        practiceCount: sessionsRes.count ?? 0,
        masteredCount: masteredRes.count ?? 0,
        dailyGoal: {
          captured_entries: dailyGoals?.captured_entries ?? 0,
          captured_verbs: dailyGoals?.captured_verbs ?? 0,
          personal_sentences_created: dailyGoals?.personal_sentences_created ?? 0,
          speaking_practices: dailyGoals?.speaking_practices ?? 0,
          listening_practices: dailyGoals?.listening_practices ?? 0,
        },
        recentPhrase: recentRes.data?.original_phrase ?? null,
        nextEntry: (nextRes.data as EntryRow | null) ?? null,
      });
      setLoading(false);
    }

    void load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="h-96 animate-pulse rounded-3xl bg-slate-200" />
          <div className="h-80 animate-pulse rounded-3xl bg-slate-200" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  const dg = data.dailyGoal;
  const missionItems = [
    { key: "chunk", done: dg.captured_entries > 0, label: "Capturar 1 chunk real", actionHref: "/capture", actionLabel: "Capturar agora" },
    { key: "verb", done: dg.captured_verbs > 0, label: "Capturar 1 verbo ou padrão", actionHref: "/capture", actionLabel: "Adicionar verbo" },
    { key: "sentences", done: dg.personal_sentences_created >= 3, label: `Criar ${dg.personal_sentences_created >= 3 ? "3" : `${dg.personal_sentences_created}/3`} frases próprias`, actionHref: "/review", actionLabel: "Criar frases" },
    { key: "listening", done: dg.listening_practices > 0, label: "Fazer 1 escuta guiada", actionHref: "/listening", actionLabel: "Treinar escuta" },
    { key: "speaking", done: dg.speaking_practices > 0, label: "Fazer 1 speaking", actionHref: "/speaking", actionLabel: "Treinar speaking" },
  ];
  const doneSteps = missionItems.filter((s) => s.done).length;
  const nextNotDone = missionItems.find((s) => !s.done);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Seu treino de hoje
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Capture, pratique e transforme chunks em frases suas.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ButtonLink href="/capture" variant="primary" size="sm">
            Capturar chunk
          </ButtonLink>
          <ButtonLink href="/speaking" variant="secondary" size="sm">
            Treinar speaking
          </ButtonLink>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <MetricCard label="Chunks" value={data.entriesCount} description="frases reais salvas" />
        <MetricCard label="Verbos" value={data.verbsCount} description="padrões para usar em frases" />
        <MetricCard label="Práticas" value={data.practiceCount} description="listening e speaking registrados" />
        <MetricCard label="Naturais" value={data.masteredCount} description="frases quase prontas para usar" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
        <DailyMissionCard
          items={missionItems}
          doneCount={doneSteps}
          totalCount={5}
        />
        <NextPracticeCard
          nextKey={nextNotDone?.key ?? null}
          doneCount={doneSteps}
          nextEntry={data.nextEntry}
        />
      </section>

      <QuickActions />

      <RecentActivity phrase={data.recentPhrase} />
    </div>
  );
}
