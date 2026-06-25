"use client";

import { useEffect, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/client";
import { completeDailyTraining } from "@/server/actions/learning";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EntryRow } from "@/types/database";

const connectors = [
  "because",
  "so",
  "but",
  "then",
  "after that",
] as const;

const themeSuggestions = [
  "Albion Online",
  "Rotina",
  "Música",
  "Programação",
  "Planos",
  "Vídeos",
];

type BlockStatus = {
  verbs: boolean;
  chunk: boolean;
  connector: boolean;
  narration: boolean;
};

export default function DailyTrainingPage() {
  const [loading, setLoading] = useState(true);
  const [verbs, setVerbs] = useState<EntryRow[]>([]);
  const [chunkCandidate, setChunkCandidate] = useState<EntryRow | null>(null);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [connectorSentence, setConnectorSentence] = useState("");
  const [narrationText, setNarrationText] = useState("");
  const [blocks, setBlocks] = useState<BlockStatus>({
    verbs: false,
    chunk: false,
    connector: false,
    narration: false,
  });
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [verbsRes, entriesRes] = await Promise.all([
        supabase
          .from("learning_entries")
          .select("*")
          .eq("entry_type", "verb")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("learning_entries")
          .select("*")
          .eq("entry_type", "chunk")
          .order("times_practiced", { ascending: true })
          .order("confidence_level", { ascending: true })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      setVerbs((verbsRes.data ?? []) as EntryRow[]);
      setChunkCandidate((entriesRes.data ?? null) as EntryRow | null);
      setLoading(false);
    }

    void load();
  }, []);

  function toggleBlock(key: keyof BlockStatus) {
    setBlocks((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleComplete() {
    setPending(true);

    try {
      await completeDailyTraining({
        narrationText: narrationText || undefined,
        connectorSentence: connectorSentence || undefined,
        connectorEntryId: selectedChunkId ?? undefined,
      });
      setDone(true);
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-96 animate-pulse rounded-3xl bg-slate-200" />
        <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Treino Diário"
          subtitle="Uma rotina simples de 20 minutos para praticar inglês de verdade."
        />
        <Card important className="border-emerald-200 bg-emerald-50/80 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
          <p className="mt-3 text-base font-semibold text-emerald-800">
            Treino diário concluído!
          </p>
          <p className="mt-1 text-sm text-emerald-600">
            Volte amanhã para mais prática.
          </p>
        </Card>
        <ButtonLink href="/daily-training" variant="secondary" className="w-full">
          Recomeçar
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Treino Diário"
        subtitle="Uma rotina simples de 20 minutos para praticar inglês de verdade."
      />

      {/* Bloco 1 — Verbos */}
      <CardBlock
        number={1}
        title="Verbos"
        time="5 min"
        description="Revise 3 a 5 verbos frequentes e crie frases simples."
        done={blocks.verbs}
        onToggle={() => toggleBlock("verbs")}
      >
        {verbs.length > 0 ? (
          <div className="space-y-2">
            {verbs.slice(0, 5).map((verb) => (
              <div
                key={verb.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <p className="font-medium text-slate-900">
                  {verb.original_phrase}
                </p>
                {verb.translation ? (
                  <p className="text-sm text-slate-500">
                    {verb.translation}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhum verbo salvo ainda."
            description="Capture alguns verbos para revisar aqui."
            actionLabel="Adicionar verbo"
            actionHref="/capture"
          />
        )}
        {verbs.length > 0 ? (
          <ButtonLink
            href="/library?type=verb"
            variant="secondary"
            size="sm"
            className="mt-3"
          >
            Revisar verbos
          </ButtonLink>
        ) : null}
      </CardBlock>

      {/* Bloco 2 — Chunk do dia */}
      <CardBlock
        number={2}
        title="Chunk do dia"
        time="5 min"
        description="Escolha um chunk real e pratique significado, pronúncia e uso."
        done={blocks.chunk}
        onToggle={() => toggleBlock("chunk")}
      >
        {chunkCandidate ? (
          <div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-lg font-semibold text-slate-900">
                {chunkCandidate.original_phrase}
              </p>
              {chunkCandidate.translation ? (
                <p className="mt-1 text-sm text-slate-500">
                  {chunkCandidate.translation}
                </p>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ButtonLink
                href="/listening"
                variant="primary"
                size="sm"
              >
                Treinar chunk
              </ButtonLink>
              <ButtonLink
                href={`/library/${chunkCandidate.id}`}
                variant="ghost"
                size="sm"
              >
                Ver detalhe
              </ButtonLink>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Nenhum chunk salvo ainda."
            description="Capture chunks para praticar no treino diário."
            actionLabel="Capturar chunk"
            actionHref="/capture"
          />
        )}
      </CardBlock>

      {/* Bloco 3 — Conectores (só aparece se chunk do dia estiver selecionado/marcado) */}
      {blocks.chunk && chunkCandidate ? (
        <CardBlock
          number={3}
          title="Conectores"
          time="5 min"
          description='Use because, so, but, then e after that para criar frases maiores.'
          done={blocks.connector}
          onToggle={() => toggleBlock("connector")}
        >
          <div className="flex flex-wrap gap-2">
            {connectors.map((c) => (
              <span
                key={c}
                className="rounded-full border border-candy-blue-500/50 bg-candy-blue-500/20 px-3 py-1 text-sm font-medium text-candy-blue-950"
              >
                {c}
              </span>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="connector-sentence">
              Escreva uma frase usando um conector
            </Label>
            <Textarea
              id="connector-sentence"
              value={connectorSentence}
              onChange={(e) => setConnectorSentence(e.target.value)}
              placeholder="Ex: I need more gold because I want better gear."
            />
          </div>
        </CardBlock>
      ) : null}

      {/* Bloco 4 — Speaking / Narração */}
      <CardBlock
        number={4}
        title="Speaking / Narração"
        time="5 min"
        description="Fale ou escreva sobre jogo, rotina, música, programação ou planos."
        done={blocks.narration}
        onToggle={() => toggleBlock("narration")}
      >
        <div className="flex flex-wrap gap-2">
          {themeSuggestions.map((theme) => (
            <span
              key={theme}
              className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-600"
            >
              {theme}
            </span>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="narration-text">Minha narração de hoje</Label>
          <Textarea
            id="narration-text"
            value={narrationText}
            onChange={(e) => setNarrationText(e.target.value)}
            placeholder="Ex: Today, I woke up at 9 AM. After that, I checked my overnight farm and got my coffee."
            className="min-h-32"
          />
        </div>
      </CardBlock>

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={
          pending ||
          !blocks.verbs ||
          !blocks.chunk ||
          !blocks.narration
        }
        onClick={handleComplete}
      >
        {pending
          ? "Salvando..."
          : "Concluir treino diário"}
      </Button>
    </div>
  );
}

/* ── Card de bloco reutilizável ── */

function CardBlock({
  number,
  title,
  time,
  description,
  done,
  onToggle,
  children,
}: {
  number: number;
  title: string;
  time: string;
  description: string;
  done: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "p-6 transition-all duration-200",
        done && "border-emerald-200 bg-emerald-50/50",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              {number}
            </span>
            <CardTitle>{title}</CardTitle>
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              {time}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
            done
              ? "bg-emerald-100 text-emerald-700"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
          )}
        >
          {done ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Feito
            </>
          ) : (
            <>
              Marcar feito
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      {children ? <div className="mt-5">{children}</div> : null}
    </Card>
  );
}
