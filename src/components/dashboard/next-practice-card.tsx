"use client";

import Link from "next/link";

type Props = {
  nextKey: string | null;
  doneCount: number;
};

const stepConfig: Record<string, { title: string; body: string; href: string; cta: string }> = {
  chunk: {
    title: "Capture um chunk",
    body: "Comece salvando uma frase real que você encontrou hoje.",
    href: "/capture",
    cta: "Capturar agora",
  },
  verb: {
    title: "Adicione um verbo",
    body: "Registre um verbo ou padrão novo que apareceu no seu dia.",
    href: "/capture",
    cta: "Adicionar verbo",
  },
  sentences: {
    title: "Crie frases próprias",
    body: "Pegue um chunk salvo e crie uma frase sua com ele.",
    href: "/review",
    cta: "Criar frases",
  },
  listening: {
    title: "Treine listening agora",
    body: "Pratique listening com um trecho curto. Foque em reconhecer palavras.",
    href: "/listening",
    cta: "Começar listening",
  },
  speaking: {
    title: "Treine speaking agora",
    body: "Escolha uma frase curta e fale em voz alta. Não precisa ser perfeito.",
    href: "/speaking",
    cta: "Começar speaking",
  },
};

export function NextPracticeCard({ nextKey, doneCount }: Props) {
  const config = nextKey ? stepConfig[nextKey] : null;

  return (
    <div className="relative flex min-h-[320px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-sm">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-candy-blue-500/10 blur-2xl" />

      <div className="relative flex flex-1 flex-col">
        <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-candy-blue-500">
          Próximo melhor treino
        </div>

        {config ? (
          <>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              {config.title}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
              {config.body}
            </p>

            <div className="mt-6 space-y-2 text-sm text-slate-300">
              <p>• 5 minutos já contam</p>
              <p>• Foque em reconhecer palavras</p>
              <p>• Não precisa entender tudo</p>
            </div>

            <div className="mt-auto pt-6">
              <Link
                href={config.href}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-slate-950 shadow-sm transition-colors hover:bg-slate-100"
              >
                {config.cta}
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Missão completa!
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
              {doneCount}/5 concluído. Volte amanhã para mais prática.
            </p>
            <div className="mt-auto pt-6">
              <Link
                href="/capture"
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-slate-950 shadow-sm transition-colors hover:bg-slate-100"
              >
                Capturar mais
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
