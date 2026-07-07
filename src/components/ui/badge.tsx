import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium";

const statusStyles: Record<string, string> = {
  new: "bg-slate-50 text-slate-600 border-slate-200",
  learning: "bg-amber-50 text-amber-700 border-amber-200",
  practicing: "bg-blue-50 text-blue-700 border-blue-200",
  almost_natural: "bg-candy-blue-500/25 text-candy-blue-950 border-candy-blue-500/50",
  mastered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  archived: "bg-slate-100 text-slate-400 border-slate-200",
};

const statusLabels: Record<string, string> = {
  new: "Novo",
  learning: "Aprendendo",
  practicing: "Praticando",
  almost_natural: "Quase natural",
  mastered: "Dominado",
  archived: "Arquivado",
};

const typeStyles: Record<string, string> = {
  chunk: "bg-candy-blue-500/25 text-candy-blue-950 border-candy-blue-500/50",
  verb: "bg-candy-blue-500/25 text-candy-blue-950 border-candy-blue-500/50",
};

const typeLabels: Record<string, string> = {
  chunk: "Chunk",
  verb: "Chunk",
};

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(base, "bg-slate-50 text-slate-600 border-slate-200", className)}
      {...props}
    />
  );
}

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const label = statusLabels[value ?? ""] ?? value ?? "Sem status";
  const style = statusStyles[value ?? ""] ?? statusStyles.new;

  return <span className={cn(base, style)}>{label}</span>;
}

export function TypeBadge({ value }: { value: string | null | undefined }) {
  const label = typeLabels[value ?? ""] ?? "Chunk";
  const style = typeStyles[value ?? ""] ?? typeStyles.chunk;

  return <span className={cn(base, style)}>{label}</span>;
}
