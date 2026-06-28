import Link from "next/link";
import { cn } from "@/lib/utils";

type MissionItem = {
  key: string;
  done: boolean;
  label: string;
  actionHref?: string;
  actionLabel?: string;
};

type Props = {
  items: MissionItem[];
  doneCount: number;
  totalCount: number;
};

export function MiniMission({ items, doneCount, totalCount }: Props) {
  const allDone = doneCount >= totalCount;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/[0.02]">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          Missão de hoje
        </h2>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.key}
            className={cn(
              "flex items-center justify-between rounded-xl px-3 py-2 text-sm",
              item.done
                ? "bg-emerald-50 text-emerald-800"
                : "bg-slate-50 text-slate-600",
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium",
                item.done
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-200 text-slate-500",
              )}>
                {item.done ? "✓" : item.key === "capture" ? "1" : item.key === "practice" ? "2" : "3"}
              </span>
              <span className={item.done ? "line-through opacity-70" : ""}>
                {item.label}
              </span>
            </div>
            {!item.done && item.actionHref ? (
              <Link
                href={item.actionHref}
                className="text-xs font-medium text-candy-blue-700 hover:underline"
              >
                {item.actionLabel}
              </Link>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{doneCount}/{totalCount} concluído</span>
          {allDone ? (
            <span className="font-medium text-emerald-600">Completa!</span>
          ) : null}
        </div>
      </div>

      {allDone ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">
          Missão de hoje concluída! Continue capturando sempre que encontrar algo novo.
        </p>
      ) : null}
    </div>
  );
}
