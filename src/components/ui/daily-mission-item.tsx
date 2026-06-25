import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  done: boolean;
  children: ReactNode;
  action?: ReactNode;
};

export function DailyMissionItem({ done, children, action }: Props) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 transition-colors",
        done
          ? "border-emerald-200 bg-emerald-50/80"
          : "border-slate-200 bg-white",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "h-2.5 w-2.5 shrink-0 rounded-full",
            done ? "bg-emerald-500" : "border border-slate-300 bg-white",
          )}
        />
        <span
          className={cn(
            "text-sm font-medium",
            done ? "text-slate-800" : "text-slate-600",
          )}
        >
          {children}
        </span>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
