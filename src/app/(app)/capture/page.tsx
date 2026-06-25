import { CaptureForm } from "@/components/forms/capture-form";
import { PageHeader } from "@/components/ui/page-header";

export default function CapturePage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Captura"
        subtitle="Salve frases reais, verbos e padrões que você encontrou no dia a dia."
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <CaptureForm />

        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-base font-semibold text-slate-900">
              Como capturar bem
            </p>
            <ol className="mt-4 space-y-3">
              {[
                "Pegue frases curtas que você encontrou.",
                "Salve de onde veio (música, jogo, conversa).",
                "Crie uma frase sua usando o chunk.",
                "Pratique falando depois na página de Speaking.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Exemplo
              </p>
              <p className="mt-2 text-sm text-slate-700">
                <span className="font-medium text-onyx">Chunk:</span> I need better gear.
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-medium text-onyx">Uso:</span> I need better gear to fight the boss.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
