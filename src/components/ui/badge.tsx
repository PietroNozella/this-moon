import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium";

const statusStyles: Record<string, string> = {
  new: "border-slate-200 bg-slate-50 text-slate-600",
  learning: "border-amber-200 bg-amber-50 text-amber-700",
  practicing: "border-sky-200 bg-sky-50 text-sky-700",
  almost_natural: "border-teal-200 bg-teal-50 text-teal-700",
  mastered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived: "border-slate-200 bg-slate-100 text-slate-400",
};

const statusLabels: Record<string, string> = {
  new: "Novo",
  learning: "Aprendendo",
  practicing: "Praticando",
  almost_natural: "Quase natural",
  mastered: "Dominado",
  archived: "Arquivado",
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


