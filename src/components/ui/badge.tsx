import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  new: "Novo",
  learning: "Aprendendo",
  practicing: "Praticando",
  almost_natural: "Quase natural",
  mastered: "Dominado",
  archived: "Arquivado",
  easy: "Facil",
  medium: "Medio",
  hard: "Dificil",
  unknown: "Sem nivel",
};

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700",
        className,
      )}
      {...props}
    />
  );
}

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const label = statusLabels[value ?? ""] ?? value ?? "Sem status";

  return <Badge>{label}</Badge>;
}

const typeLabels: Record<string, string> = {
  chunk: "Chunk",
  verb: "Verbo",
};

export function TypeBadge({ value }: { value: string | null | undefined }) {
  const label = typeLabels[value ?? ""] ?? value ?? "Chunk";

  return (
    <Badge
      className={
        value === "verb"
          ? "border-violet-200 bg-violet-50 text-violet-700"
          : "border-sky-200 bg-sky-50 text-sky-700"
      }
    >
      {label}
    </Badge>
  );
}
