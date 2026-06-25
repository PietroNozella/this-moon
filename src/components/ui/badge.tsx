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
