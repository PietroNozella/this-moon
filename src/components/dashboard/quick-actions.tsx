import Link from "next/link";

const actions = [
  {
    href: "/practice",
    title: "Praticar",
    description: "Ouça, repita e fale chunks até soar natural.",
    cta: "Praticar",
  },
  {
    href: "/library",
    title: "Biblioteca",
    description: "Veja seus chunks e verbos salvos.",
    cta: "Abrir",
  },
  {
    href: "/coach",
    title: "AI Coach",
    description: "Treino personalizado com IA.",
    cta: "Conversar",
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
              {action.title === "Praticar" ? "P" : action.title === "Biblioteca" ? "B" : "C"}
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
