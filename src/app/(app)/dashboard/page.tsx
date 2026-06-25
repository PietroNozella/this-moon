"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useLocalStore } from "@/components/local-store-provider";
import { getDashboardData } from "@/lib/local-selectors";
import { formatDate } from "@/lib/utils";

const quickActions = [
  { href: "/review", label: "Revisar hoje" },
  { href: "/capture", label: "Capturar nova frase" },
  { href: "/practice", label: "Praticar speaking" },
  { href: "/music", label: "Estudar música" },
  { href: "/library", label: "Criar frases minhas" },
];

export default function DashboardPage() {
  const { state, isLoaded } = useLocalStore();
  const data = getDashboardData(state);
  const dailySteps = [
    data.dailyGoal.captured_entries > 0,
    data.dailyGoal.personal_sentences_created >= 3,
    data.reviewStep.done,
    data.dailyGoal.speaking_practices > 0,
  ];
  const doneSteps = dailySteps.filter(Boolean).length;

  if (!isLoaded) {
    return <Card className="text-slate-500">Carregando seus dados locais...</Card>;
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
            {quickActions.map((action) => (
              <ButtonLink
                key={action.href}
                href={action.href}
                variant="secondary"
                className="justify-start"
              >
                {action.label}
              </ButtonLink>
            ))}
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
