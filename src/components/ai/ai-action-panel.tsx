"use client";

import { useState } from "react";
import { Sparkles, BookOpen, MessageSquare, Speech } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AILoadingState } from "@/components/ai/ai-loading-state";
import { AIErrorState } from "@/components/ai/ai-error-state";
import { generateEntryHelper } from "@/server/actions/ai";

type ActionType = "explain" | "sentences" | "roleplay";

type Props = {
  entryId: string;
  phrase: string;
};

const actionConfig: Record<ActionType, { label: string; icon: typeof Sparkles }> = {
  explain: { label: "Explicar melhor", icon: BookOpen },
  sentences: { label: "Criar 5 frases", icon: MessageSquare },
  roleplay: { label: "Criar roleplay", icon: Speech },
};

export function AIActionPanel({ entryId, phrase }: Props) {
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: ActionType) {
    setActiveAction(action);
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await generateEntryHelper(entryId, action);
    setLoading(false);

    if (res.success) {
      setResult(res.data);
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Ajuda da IA
      </p>
      <div className="mt-3 space-y-2">
        {(Object.entries(actionConfig) as [ActionType, typeof actionConfig[ActionType]][]).map(
          ([key, config]) => (
            <Button
              key={key}
              type="button"
              variant="ghost"
              size="sm"
              disabled={loading && activeAction === key}
              onClick={() => void handleAction(key)}
              className="w-full justify-start gap-2 text-sm text-slate-600 hover:text-candy-blue-950"
            >
              <config.icon className="h-4 w-4 shrink-0" />
              {config.label}
            </Button>
          ),
        )}
      </div>

      {loading && activeAction ? <AILoadingState className="mt-3" /> : null}
      {error ? <AIErrorState message={error} className="mt-3" /> : null}

      {result && activeAction === "explain" ? (
        <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 text-sm">
          {result.translation ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tradução</p>
              <p className="mt-0.5 text-slate-900">{result.translation as string}</p>
            </div>
          ) : null}
          {result.explanation ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Explicação</p>
              <p className="mt-0.5 leading-6 text-slate-600">{result.explanation as string}</p>
            </div>
          ) : null}
          {result.naturalVersion ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Versão natural</p>
              <p className="mt-0.5 italic text-slate-600">{result.naturalVersion as string}</p>
            </div>
          ) : null}
          {result.pronunciationTip ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pronúncia</p>
              <p className="mt-0.5 text-slate-600">{result.pronunciationTip as string}</p>
            </div>
          ) : null}
          {result.whenToUse ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quando usar</p>
              <p className="mt-0.5 text-slate-600">{result.whenToUse as string}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {result && activeAction === "sentences" ? (
        <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
          {Array.isArray(result.sentences) ? (
            (result.sentences as Array<{ context: string; sentence: string }>).map((item, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{item.context}</p>
                <p className="mt-1 text-sm text-slate-900">{item.sentence}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">{JSON.stringify(result.sentences)}</p>
          )}
        </div>
      ) : null}

      {result && activeAction === "roleplay" ? (
        <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
          {result.context ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contexto</p>
              <p className="mt-0.5 text-sm text-slate-600">{result.context as string}</p>
            </div>
          ) : null}
          {Array.isArray(result.lines) ? (
            <div className="space-y-2">
              {(result.lines as Array<{ speaker: string; text: string }>).map((line, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-medium text-candy-blue-700">{line.speaker}</p>
                  <p className="mt-0.5 text-sm text-slate-700">{line.text}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
