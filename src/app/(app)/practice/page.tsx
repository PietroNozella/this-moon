"use client";

import { useEffect, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { completeSpeakingPractice } from "@/server/actions/learning";

const modes = [
  {
    title: "Speaking",
    description: "Repita frases salvas e marque o que soou natural.",
    href: "/review",
  },
  {
    title: "Listening",
    description: "Use trechos curtos e capture palavras reconhecidas.",
    href: "/capture",
  },
  {
    title: "Roleplay",
    description: "Responda cenários simples de rotina, jogos e código.",
    href: "/library",
  },
];

export default function PracticePage() {
  const [speakingDone, setSpeakingDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());

      const { data: goal } = await supabase
        .from("daily_goals")
        .select("speaking_practices")
        .eq("goal_date", today)
        .maybeSingle();

      setSpeakingDone((goal?.speaking_practices as number | null ?? 0) > 0);
      setLoading(false);
    }

    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Prática</p>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          Prática ativa
        </h1>
      </div>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>Missão diária de fala</CardTitle>
            <p className="text-sm text-slate-500">
              {speakingDone
                ? "Você já concluiu a frase falada de hoje."
                : "Depois de falar uma frase em voz alta, marque aqui para concluir a etapa."}
            </p>
          </div>
          <Button
            type="button"
            onClick={async () => {
              await completeSpeakingPractice();
              setSpeakingDone(true);
            }}
            disabled={loading || speakingDone}
          >
            {speakingDone ? "Frase falada concluída" : "Marcar frase falada"}
          </Button>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {modes.map((mode) => (
          <Card key={mode.title}>
            <CardTitle>{mode.title}</CardTitle>
            <p className="mt-2 min-h-16 text-sm leading-6 text-slate-500">
              {mode.description}
            </p>
            <ButtonLink href={mode.href} className="mt-5" variant="secondary">
              Começar
            </ButtonLink>
          </Card>
        ))}
      </section>
    </div>
  );
}
