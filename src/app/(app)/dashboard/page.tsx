"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { ChunkRow, DailyGoalRow, EntryRow, ReviewRow } from "@/types/database";

type DashboardData = {
  entriesCount: number;
  personalSentencesCount: number;
  pendingReviewsCount: number;
  completedReviewsCount: number;
  masteredChunksCount: number;
  activeChunksCount: number;
  dailyGoal: {
    captured_entries: number;
    personal_sentences_created: number;
    reviews_completed: number;
    speaking_practices: number;
  };
  reviewStep: { done: boolean; label: string; hint: string };
  chunkOfDay: ChunkRow | null;
  recentEntries: EntryRow[];
};

const emptyData: DashboardData = {
  entriesCount: 0,
  personalSentencesCount: 0,
  pendingReviewsCount: 0,
  completedReviewsCount: 0,
  masteredChunksCount: 0,
  activeChunksCount: 0,
  dailyGoal: {
    captured_entries: 0,
    personal_sentences_created: 0,
    reviews_completed: 0,
    speaking_practices: 0,
  },
  reviewStep: { done: true, label: "Sem revisão pendente hoje", hint: "" },
  chunkOfDay: null,
  recentEntries: [],
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);

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

      const [entriesRes, sentencesRes, reviewsDueRes, reviewsDoneRes, chunksRes, recentRes, goalRes] =
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
            .from("reviews")
            .select("*")
            .not("reviewed_at", "is", null),
          supabase
            .from("chunks")
            .select("*")
            .order("usage_count", { ascending: false }),
          supabase
            .from("learning_entries")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("daily_goals")
            .select("*")
            .eq("goal_date", today)
            .maybeSingle(),
        ]);

      const entriesCount = entriesRes.count ?? 0;
      const personalSentencesCount = sentencesRes.count ?? 0;
      const dueReviews = (reviewsDueRes.data ?? []) as ReviewRow[];
      const allReviews = (reviewsDoneRes.data ?? []) as ReviewRow[];
      const allChunks = (chunksRes.data ?? []) as ChunkRow[];
      const recentEntries = (recentRes.data ?? []) as EntryRow[];
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
        completedReviewsCount: allReviews?.length ?? 0,
        masteredChunksCount:
          allChunks?.filter((c) => c.status === "mastered").length ?? 0,
        activeChunksCount:
          allChunks?.filter((c) =>
            ["new", "learning", "practicing", "almost_natural"].includes(
              c.status ?? "",
            ),
          ).length ?? 0,
        dailyGoal,
        reviewStep: {
          done: reviewStepDone,
          label: isDueReviewPending
            ? "1 revisão rápida"
            : "Sem revisão pendente hoje",
          hint: isDueReviewPending
            ? "Conclua uma revisão disponível para fechar essa etapa."
            : "As próximas revisões aparecem aqui quando vencerem.",
        },
        chunkOfDay: (allChunks as ChunkRow[])?.[0] ?? null,
        recentEntries: (recentEntries as EntryRow[]) ?? [],
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
          <p className="text-sm text-slate-500">Chunks dominados</p>
          <p className="mt-2 text-3xl font-semibold">
            {data.masteredChunksCount}
          </p>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Chunk do dia</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Use em voz alta e crie uma variação sua.
              </p>
            </div>
            <Badge>{data.activeChunksCount} em prática</Badge>
          </div>

          {data.chunkOfDay ? (
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
              <p className="text-2xl font-semibold text-slate-950">
                {data.chunkOfDay.chunk_text}
              </p>
              {data.chunkOfDay.translation ? (
                <p className="mt-2 text-slate-600">
                  {data.chunkOfDay.translation}
                </p>
              ) : null}
              {data.chunkOfDay.casual_version ? (
                <p className="mt-4 text-sm text-slate-500">
                  Falado: {data.chunkOfDay.casual_version}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-5 text-slate-500">
              Comece salvando uma frase que você ouviu hoje.
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Missão diária</CardTitle>
          <div className="mt-5 space-y-3">
            <ProgressRow done={data.dailyGoal.captured_entries > 0}>
              1 frase capturada
            </ProgressRow>
            <ProgressRow done={data.dailyGoal.personal_sentences_created >= 3}>
              3 frases próprias
            </ProgressRow>
            <ProgressRow done={data.reviewStep.done} hint={data.reviewStep.hint}>
              {data.reviewStep.label}
            </ProgressRow>
            <ProgressRow done={data.dailyGoal.speaking_practices > 0}>
              1 frase falada
            </ProgressRow>
          </div>
          <p className="mt-5 text-sm text-slate-500">{doneSteps}/4 concluído</p>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
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
              href="/practice"
              variant="secondary"
              className="justify-start"
            >
              Praticar speaking
            </ButtonLink>
            <ButtonLink
              href="/music"
              variant="secondary"
              className="justify-start"
            >
              Estudar música
            </ButtonLink>
            <ButtonLink
              href="/library"
              variant="secondary"
              className="justify-start"
            >
              Criar frases minhas
            </ButtonLink>
          </div>
        </Card>

        <Card>
          <CardTitle>Entradas recentes</CardTitle>
          <div className="mt-4 divide-y divide-slate-100">
            {data.recentEntries.length > 0 ? (
              data.recentEntries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/library/${entry.id}`}
                  className="block py-3 transition hover:text-emerald-700"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-slate-950">
                      {entry.original_phrase}
                    </p>
                    <span className="text-sm text-slate-400">
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {entry.context_note}
                  </p>
                </Link>
              ))
            ) : (
              <p className="py-6 text-sm text-slate-500">
                Sua biblioteca ainda está vazia. Capture sua primeira frase.
              </p>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

function ProgressRow({
  done,
  hint,
  children,
}: {
  done: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-1 size-3 rounded-full ${done ? "bg-emerald-500" : "bg-slate-300"}`}
      />
      <div>
        <span className={done ? "text-slate-950" : "text-slate-500"}>
          {children}
        </span>
        {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
      </div>
    </div>
  );
}
