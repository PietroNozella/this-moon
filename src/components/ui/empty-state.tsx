import type { ReactNode } from "react";

import { ButtonLink } from "@/components/ui/button";

type Props = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: Props) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      {actionLabel && actionHref ? (
        <ButtonLink href={actionHref} variant="primary" className="mt-6">
          {actionLabel}
        </ButtonLink>
      ) : null}
    </div>
  );
}
