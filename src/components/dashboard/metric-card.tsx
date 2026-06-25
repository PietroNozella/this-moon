type Props = {
  label: string;
  value: string | number;
  description?: string;
};

export function MetricCard({ label, value, description }: Props) {
  return (
    <div className="flex min-h-[116px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-black/[0.02]">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <div className="h-8 w-8 rounded-xl bg-candy-blue-500/25" />
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      {description ? (
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}
