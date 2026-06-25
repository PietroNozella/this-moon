import Link from "next/link";

const actions = [
  {
    href: "/listening",
    title: "Listening",
    description: "Reconheça palavras em trechos reais.",
    cta: "Treinar",
  },
  {
    href: "/speaking",
    title: "Speaking",
    description: "Repita frases até soar natural.",
    cta: "Treinar",
  },
  {
    href: "/review",
    title: "Review",
    description: "Crie frases próprias com chunks salvos.",
    cta: "Revisar",
  },
];

export function QuickActions() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
        >
          <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <span className="text-xs font-bold">
              {action.title === "Listening" ? "L" : action.title === "Speaking" ? "S" : "R"}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-950">
            {action.title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {action.description}
          </p>
          <span className="mt-4 inline-flex text-sm font-medium text-slate-900">
            {action.cta}
            <span className="ml-1 transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </Link>
      ))}
    </section>
  );
}
