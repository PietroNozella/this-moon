"use client";

import { cn } from "@/lib/utils";

const levels = [
  { value: 1, label: "Quase nada" },
  { value: 2, label: "Palavras soltas" },
  { value: 3, label: "Ideia geral" },
  { value: 4, label: "Quase tudo" },
  { value: 5, label: "Entendi e consigo repetir" },
];

type Props = {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function ConfidenceScale({ value, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {levels.map((level) => (
        <button
          key={level.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(level.value)}
          className={cn(
            "rounded-xl border p-3 text-center text-xs transition-all duration-200",
            value === level.value
              ? "border-onyx bg-onyx text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-400",
            disabled && "opacity-50 pointer-events-none",
          )}
        >
          <span className="block text-base font-semibold">{level.value}</span>
          <span className="mt-1 block leading-tight">{level.label}</span>
        </button>
      ))}
    </div>
  );
}
