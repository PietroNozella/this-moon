"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { ConfidenceScale } from "@/components/ui/confidence-scale";
import { Label, Select } from "@/components/ui/form";
import { difficulties, entryStatuses } from "@/lib/validators/learning";
import { updateEntryProgress } from "@/server/actions/learning";

type ProgressValue = {
  status: string | null;
  difficulty: string | null;
  confidence_level: number | null;
};

type Props = {
  entryId: string;
  value: ProgressValue;
  onSaved?: (value: ProgressValue) => void;
};

const statusLabels: Record<string, string> = {
  new: "Novo",
  learning: "Aprendendo",
  practicing: "Praticando",
  almost_natural: "Quase natural",
  mastered: "Dominado",
  archived: "Arquivado",
};

const difficultyLabels: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
  unknown: "Não sei",
};

export function ChunkProgressForm({ entryId, value, onSaved }: Props) {
  const [status, setStatus] = useState(value.status ?? "new");
  const [difficulty, setDifficulty] = useState(value.difficulty ?? "unknown");
  const [confidence, setConfidence] = useState<number | null>(value.confidence_level ?? null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setSaved(false);
    setError(null);

    try {
      const updated = await updateEntryProgress({
        entryId,
        status,
        difficulty,
        confidenceLevel: confidence,
      });

      onSaved?.(updated);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar progresso.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <div className="space-y-1.5">
          <Label htmlFor="chunk-status" className="text-xs uppercase tracking-[0.12em] text-slate-500">
            Status
          </Label>
          <Select id="chunk-status" value={status} onChange={(event) => setStatus(event.target.value)}>
            {entryStatuses.map((item) => (
              <option key={item} value={item}>
                {statusLabels[item]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="chunk-difficulty" className="text-xs uppercase tracking-[0.12em] text-slate-500">
            Dificuldade
          </Label>
          <Select id="chunk-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            {difficulties.map((item) => (
              <option key={item} value={item}>
                {difficultyLabels[item]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs uppercase tracking-[0.12em] text-slate-500">Entendimento</Label>
          <span className="text-xs font-medium text-slate-500">{confidence ? `${confidence}/5` : "Sem nota"}</span>
        </div>
        <ConfidenceScale value={confidence} onChange={setConfidence} disabled={pending} compact />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" size="sm" disabled={pending} className="flex-1">
          {pending ? "Salvando..." : "Salvar progresso"}
        </Button>
        {saved ? <span className="text-xs font-medium text-emerald-600">Salvo</span> : null}
      </div>
    </form>
  );
}