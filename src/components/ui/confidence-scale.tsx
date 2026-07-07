"use client";

import { cn } from "@/lib/utils";

const levels = [
  { value: 1, label: "Quase nada" },
  { value: 2, label: "Palavras soltas" },
  { value: 3, label: "Ideia geral" },
  { value: 4, label: "Quase tudo" },
  { value: 5, label: "Consigo usar" },
];

type Props = {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  compact?: boolean;
};

export function ConfidenceScale({ value, onChange, disabled, compact }: Props) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {levels.map((level) => (
        <button
          key={level.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(level.value)}
          className={cn(
            "rounded-xl border text-center text-xs transition-all duration-200",
            compact ? "px-1.5 py-2" : "p-3",
            value === level.value
              ? "border-onyx bg-onyx text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-400",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <span className={cn("block font-semibold", compact ? "text-sm" : "text-base")}>{level.value}</span>
          {!compact ? <span className="mt-1 block leading-tight">{level.label}</span> : null}
        </button>
      ))}
    </div>
  );
}