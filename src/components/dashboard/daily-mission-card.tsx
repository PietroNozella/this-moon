"use client";

import { ButtonLink } from "@/components/ui/button";
import { DailyMissionItem } from "@/components/ui/daily-mission-item";

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

export function DailyMissionCard({ items, doneCount, totalCount }: Props) {
  const nextNotDone = items.find((s) => !s.done);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/[0.02]">
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          Missão de hoje
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Um ciclo curto para ouvir, repetir e usar.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <DailyMissionItem
            key={item.key}
            done={item.done}
            action={
              !item.done && item.actionHref ? (
                <ButtonLink
                  href={item.actionHref}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  {item.actionLabel}
                </ButtonLink>
              ) : null
            }
          >
            {item.label}
          </DailyMissionItem>
        ))}
      </div>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{doneCount}/{totalCount} concluído</span>
          {nextNotDone ? (
            <span>
              Falta{" "}
              {nextNotDone.key === "listening"
                ? "escuta guiada"
                : nextNotDone.key === "speaking"
                  ? "speaking"
                  : nextNotDone.key === "sentences"
                    ? "frases próprias"
                    : nextNotDone.key === "chunk"
                      ? "chunk"
                      : "verbo"}
            </span>
          ) : (
            <span>Missão completa!</span>
          )}
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-onyx transition-all duration-500"
            style={{ width: `${(doneCount / totalCount) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
