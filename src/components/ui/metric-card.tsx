import type { ReactNode } from "react";

type Props = {
  label: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
};

export function MetricCard({ label, value, description, icon }: Props) {
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {icon ? (
        <div className="absolute right-4 top-4 text-slate-300">{icon}</div>
      ) : null}
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      {description ? (
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}
