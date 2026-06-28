"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { MiniMission } from "@/components/mini-mission";
import { QuickCapture } from "@/components/quick-capture";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/utils";
import type { DailyGoalRow } from "@/types/database";

type DashboardData = {
  entriesCount: number;
  dailyGoal: {
    captured_entries: number;
    captured_verbs: number;
    personal_sentences_created: number;
    speaking_practices: number;
    listening_practices: number;
  };
  recentPhrase: string | null;
};

const emptyData: DashboardData = {
  entriesCount: 0,
  dailyGoal: {
    captured_entries: 0,
    captured_verbs: 0,
    personal_sentences_created: 0,
    speaking_practices: 0,
    listening_practices: 0,
  },
  recentPhrase: null,
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const today = todayISO();

      const [entriesRes, goalRes, recentRes] = await Promise.all([
        supabase.from("learning_entries").select("*", { count: "exact", head: true }),
        supabase.from("daily_goals").select("*").eq("goal_date", today).maybeSingle(),
        supabase
          .from("learning_entries")
          .select("original_phrase")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const dailyGoals = goalRes.data as DailyGoalRow | null;

      setData({
        entriesCount: entriesRes.count ?? 0,
        dailyGoal: {
          captured_entries: dailyGoals?.captured_entries ?? 0,
          captured_verbs: dailyGoals?.captured_verbs ?? 0,
          personal_sentences_created: dailyGoals?.personal_sentences_created ?? 0,
          speaking_practices: dailyGoals?.speaking_practices ?? 0,
          listening_practices: dailyGoals?.listening_practices ?? 0,
        },
        recentPhrase: recentRes.data?.original_phrase ?? null,
      });
      setLoading(false);
    }

    void load();
  }, []);

  const dg = data.dailyGoal;
  const practicedCount = dg.speaking_practices + dg.listening_practices;
  const hasAnyCapture = dg.captured_entries > 0 || dg.captured_verbs > 0;

  const missionItems = [
    { key: "capture", done: hasAnyCapture, label: "Capturar 1 frase real", actionHref: "#capture", actionLabel: "Capturar" },
    { key: "practice", done: practicedCount > 0, label: "Treinar 1 frase (ouvir + repetir)", actionHref: "/practice", actionLabel: "Treinar" },
    { key: "sentence", done: dg.personal_sentences_created >= 1, label: "Criar 1 frase sua", actionHref: "/library", actionLabel: "Criar" },
  ];

  const doneSteps = missionItems.filter((s) => s.done).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />
        <div className="h-48 animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Hoje
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Capture, repita e transforme inglês real em fala sua.
        </p>
      </header>

      <section id="capture">
        <QuickCapture />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <MiniMission
          items={missionItems}
          doneCount={doneSteps}
          totalCount={3}
        />

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/[0.02]">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Ações rápidas
          </h2>
          <div className="mt-4 space-y-3">
            <Link
              href="/practice"
              className="flex items-center justify-between rounded-xl bg-onyx px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              <span>Treinar agora</span>
              <span className="text-candy-blue-500">→</span>
            </Link>
            <Link
              href="/review"
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100"
            >
              <span>Revisar</span>
              <span className="text-slate-400">→</span>
            </Link>
            <Link
              href="/library"
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100"
            >
              <span>Biblioteca</span>
              <span className="text-slate-400">→</span>
            </Link>
          </div>

          {data.entriesCount > 0 ? (
            <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Total
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {data.entriesCount} {data.entriesCount === 1 ? "entrada salva" : "entradas salvas"}
              </p>
              {data.recentPhrase ? (
                <p className="mt-1 text-sm text-slate-500 italic truncate">
                  Última: &ldquo;{data.recentPhrase}&rdquo;
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
