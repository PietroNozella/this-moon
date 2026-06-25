import { CaptureForm } from "@/components/forms/capture-form";

export default function CapturePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Capturar novo aprendizado
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Salve frases, verbos e padrões que você encontrou em músicas, jogos,
          vídeos ou conversas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <CaptureForm />

        <aside className="hidden xl:block">
          <div className="sticky top-24 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Como capturar bem
            </p>
            <ol className="mt-4 space-y-3">
              {[
                "Pegue frases curtas.",
                "Salve de onde veio.",
                "Escreva onde usaria.",
                "Crie uma frase sua.",
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
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Exemplo
              </p>
              <p className="mt-2 text-sm text-slate-700">
                <span className="font-medium text-onyx">Chunk:</span> I need
                better gear.
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-medium text-onyx">Uso:</span> I need
                better gear to fight the boss.
              </p>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-400">
              Não preencha tudo. Capture rápido e pratique depois.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
