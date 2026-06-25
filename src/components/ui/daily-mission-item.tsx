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
        "flex items-center justify-between gap-3 rounded-xl border p-3",
        done
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "h-3 w-3 shrink-0 rounded-full",
            done ? "bg-emerald-500" : "border border-slate-300 bg-white",
          )}
        />
        <span className={done ? "text-onyx" : "text-slate-600"}>
          {children}
        </span>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
