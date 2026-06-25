"use client";

import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { DailyMissionItem } from "@/components/ui/daily-mission-item";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/utils";
import type { DailyGoalRow } from "@/types/database";

type DashboardData = {
  entriesCount: number;
  verbsCount: number;
  sentencesCount: number;
  masteredCount: number;
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
  verbsCount: 0,
  sentencesCount: 0,
  masteredCount: 0,
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

      const [entriesRes, verbsRes, sentencesRes, masteredRes, goalRes, recentRes] =
        await Promise.all([
          supabase.from("learning_entries").select("*", { count: "exact", head: true }),
          supabase.from("learning_entries").select("*", { count: "exact", head: true }).eq("entry_type", "verb"),
          supabase.from("personal_sentences").select("*", { count: "exact", head: true }),
          supabase.from("learning_entries").select("*", { count: "exact", head: true }).eq("status", "mastered"),
          supabase.from("daily_goals").select("*").eq("goal_date", today).maybeSingle(),
          supabase.from("learning_entries").select("original_phrase").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        ]);

      const dailyGoals = goalRes.data as DailyGoalRow | null;

      setData({
        entriesCount: entriesRes.count ?? 0,
        verbsCount: verbsRes.count ?? 0,
        sentencesCount: sentencesRes.count ?? 0,
        masteredCount: masteredRes.count ?? 0,
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const dg = data.dailyGoal;
  const dailySteps = [
    { key: "chunk", done: dg.captured_entries > 0, label: "Capturar 1 chunk real" },
    { key: "verb", done: dg.captured_verbs > 0, label: "Capturar 1 verbo ou padrão" },
    { key: "sentences", done: dg.personal_sentences_created >= 3, label: `Criar ${dg.personal_sentences_created >= 3 ? "3" : `${dg.personal_sentences_created}/3`} frases próprias` },
    { key: "listening", done: dg.listening_practices > 0, label: "Fazer 1 listening" },
    { key: "speaking", done: dg.speaking_practices > 0, label: "Fazer 1 speaking" },
  ];
  const doneSteps = dailySteps.filter((s) => s.done).length;

  const nextNotDone = dailySteps.find((s) => !s.done);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Hoje"
        subtitle="Continue seu contato ativo com inglês."
        action={
          <div className="hidden gap-2 md:flex">
            <ButtonLink href="/capture" variant="primary" size="sm">
              Capturar chunk
            </ButtonLink>
            <ButtonLink href="/speaking" variant="secondary" size="sm">
              Treinar speaking
            </ButtonLink>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Chunks" value={data.entriesCount} description="frases reais salvas" />
        <MetricCard label="Verbos" value={data.verbsCount} description="padrões para usar em frases" />
        <MetricCard label="Práticas" value={data.sentencesCount} description="listening e speaking registrados" />
        <MetricCard label="Dominados" value={data.masteredCount} description="quase prontos para usar" />
      </section>

      <section className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <Card important>
          <CardTitle>Missão de hoje</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Um ciclo curto para ouvir, repetir e usar.
          </p>
          <div className="mt-5 space-y-2">
            <DailyMissionItem
              done={dg.captured_entries > 0}
              action={
                dg.captured_entries === 0 ? (
                  <ButtonLink href="/capture" variant="ghost" size="sm">
                    Capturar agora
                  </ButtonLink>
                ) : null
              }
            >
              Capturar 1 chunk real
            </DailyMissionItem>
            <DailyMissionItem
              done={dg.captured_verbs > 0}
              action={
                dg.captured_verbs === 0 ? (
                  <ButtonLink href="/capture" variant="ghost" size="sm">
                    Adicionar verbo
                  </ButtonLink>
                ) : null
              }
            >
              Capturar 1 verbo ou padrão
            </DailyMissionItem>
            <DailyMissionItem
              done={dg.personal_sentences_created >= 3}
              action={
                dg.personal_sentences_created < 3 ? (
                  <ButtonLink href="/review" variant="ghost" size="sm">
                    Criar frases
                  </ButtonLink>
                ) : null
              }
            >
              Criar 3 frases próprias
            </DailyMissionItem>
            <DailyMissionItem
              done={dg.listening_practices > 0}
              action={
                dg.listening_practices === 0 ? (
                  <ButtonLink href="/listening" variant="ghost" size="sm">
                    Treinar listening
                  </ButtonLink>
                ) : null
              }
            >
              Fazer 1 listening
            </DailyMissionItem>
            <DailyMissionItem
              done={dg.speaking_practices > 0}
              action={
                dg.speaking_practices === 0 ? (
                  <ButtonLink href="/speaking" variant="ghost" size="sm">
                    Treinar speaking
                  </ButtonLink>
                ) : null
              }
            >
              Fazer 1 speaking
            </DailyMissionItem>
          </div>
          <p className="mt-5 text-sm text-slate-500">{doneSteps}/5 concluído</p>
        </Card>

        <Card important className="flex flex-col justify-between bg-onyx text-white">
          <div>
            <p className="text-sm font-semibold text-candy-blue-500">
              Próximo melhor treino
            </p>
            <p className="mt-3 text-sm leading-6 text-white/80">
              {nextNotDone
                ? `Você já capturou ${doneSteps > 0 ? "algo" : "nada"} hoje. ${nextNotDone.key === "listening" ? "Pratique listening com um trecho curto." : nextNotDone.key === "speaking" ? "Escolha uma frase curta e fale em voz alta." : nextNotDone.key === "sentences" ? "Crie uma frase sua com um chunk salvo." : "Capture uma frase real para começar."}`
                : "Missão completa! Volte amanhã."}
            </p>
          </div>
          {nextNotDone ? (
            <ButtonLink
              href={
                nextNotDone.key === "chunk"
                  ? "/capture"
                  : nextNotDone.key === "verb"
                    ? "/capture"
                    : nextNotDone.key === "sentences"
                      ? "/review"
                      : nextNotDone.key === "listening"
                        ? "/listening"
                        : "/speaking"
              }
              variant="primary"
              className="mt-4 w-full bg-white text-onyx hover:bg-slate-100"
            >
              {nextNotDone.key === "listening"
                ? "Começar listening"
                : nextNotDone.key === "speaking"
                  ? "Começar speaking"
                  : nextNotDone.key === "sentences"
                    ? "Criar frases"
                    : "Capturar agora"}
            </ButtonLink>
          ) : null}
          <p className="mt-3 text-xs text-white/50">5 minutos já contam.</p>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card clickable asChild>
          <a href="/listening" className="block">
            <p className="text-sm font-medium text-slate-600">Listening</p>
            <p className="mt-1 text-sm text-slate-500">
              Reconheça palavras em trechos reais.
            </p>
            <span className="mt-3 inline-block text-sm font-medium text-candy-blue-700">
              Treinar →
            </span>
          </a>
        </Card>
        <Card clickable asChild>
          <a href="/speaking" className="block">
            <p className="text-sm font-medium text-slate-600">Speaking</p>
            <p className="mt-1 text-sm text-slate-500">
              Repita frases até soar natural.
            </p>
            <span className="mt-3 inline-block text-sm font-medium text-candy-blue-700">
              Treinar →
            </span>
          </a>
        </Card>
        <Card clickable asChild>
          <a href="/review" className="block">
            <p className="text-sm font-medium text-slate-600">Review</p>
            <p className="mt-1 text-sm text-slate-500">
              Crie frases próprias com chunks salvos.
            </p>
            <span className="mt-3 inline-block text-sm font-medium text-candy-blue-700">
              Revisar →
            </span>
          </a>
        </Card>
      </section>

      {data.recentPhrase ? (
        <Card>
          <CardTitle>Atividade recente</CardTitle>
          <p className="mt-2 text-sm text-slate-600">
            Último chunk capturado:{" "}
            <span className="font-medium text-onyx">{data.recentPhrase}</span>
          </p>
        </Card>
      ) : null}
    </div>
  );
}
