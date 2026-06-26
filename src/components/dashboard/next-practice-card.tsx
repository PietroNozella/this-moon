"use client";

import Link from "next/link";
import type { EntryRow } from "@/types/database";

type Props = {
  nextKey: string | null;
  doneCount: number;
  nextEntry?: EntryRow | null;
};

const stepConfig: Record<
  string,
  { title: string; body: string; href: string; cta: string }
> = {
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
    href: "/library",
    cta: "Criar frases",
  },
  practice: {
    title: "Pratique agora",
    body: "Ouça o chunk, repita em voz alta e crie frases suas.",
    href: "/practice",
    cta: "Praticar agora",
  },
};

export function NextPracticeCard({ nextKey, doneCount, nextEntry }: Props) {
  const config = nextKey ? stepConfig[nextKey] : null;

  return (
    <div className="group relative flex min-h-[320px] flex-col overflow-hidden rounded-3xl border bg-onyx p-6 shadow-sm transition-all duration-300 hover:border-slate-200 hover:bg-white">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-candy-blue-500/20 blur-2xl transition-all duration-300 group-hover:bg-candy-blue-500/10" />

      <div className="relative flex flex-1 flex-col">
        <div className="mb-4 inline-flex rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-candy-blue-500 transition-all duration-300 group-hover:border-candy-blue-500/30 group-hover:bg-candy-blue-500/10">
          Próximo melhor treino
        </div>

        {nextEntry ? (
          <>
            <h2 className="text-xl font-semibold tracking-tight text-white transition-all duration-300 group-hover:text-slate-950">
              Treine &ldquo;{nextEntry.original_phrase}&rdquo;
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/60 transition-all duration-300 group-hover:text-slate-500">
              {nextEntry.entry_type === "verb"
                ? `Crie frases usando ${nextEntry.original_phrase} com padrões diferentes.`
                : "Você salvou esse chunk, mas ainda não registrou prática de escuta."}
            </p>

            <div className="mt-6 space-y-2 text-sm text-white/60 transition-all duration-300 group-hover:text-slate-500">
              {nextEntry.entry_type === "verb" ? (
                <>
                  <p>• Crie frases afirmativa, negativa e pergunta</p>
                  <p>• Use padrões como I need..., I need to...</p>
                  <p>• Depois adicione conectores (because, so, but)</p>
                </>
              ) : (
                <>
                  <p>• 5 minutos já contam</p>
                  <p>• Foque em reconhecer palavras</p>
                  <p>• Não precisa entender tudo</p>
                </>
              )}
            </div>

            <div className="mt-auto flex gap-2 pt-6">
              <Link
                href={nextEntry.entry_type === "verb" ? `/library/${nextEntry.id}` : "/practice"}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-onyx shadow-sm transition-all duration-300 hover:bg-slate-100 group-hover:bg-onyx group-hover:text-white group-hover:hover:bg-slate-800"
              >
                {nextEntry.entry_type === "verb" ? "Treinar padrões" : "Treinar agora"}
              </Link>
              <Link
                href={`/library/${nextEntry.id}`}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/20 px-4 text-sm font-medium text-white/70 shadow-sm transition-all duration-300 hover:bg-white/10 group-hover:border-slate-300 group-hover:text-slate-600"
              >
                Ver detalhe
              </Link>
            </div>
          </>
        ) : config ? (
          <>
            <h2 className="text-xl font-semibold tracking-tight text-white transition-all duration-300 group-hover:text-slate-950">
              {config.title}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/60 transition-all duration-300 group-hover:text-slate-500">
              {config.body}
            </p>

            <div className="mt-6 space-y-2 text-sm text-white/60 transition-all duration-300 group-hover:text-slate-500">
              <p>• 5 minutos já contam</p>
              <p>• Foque em reconhecer palavras</p>
              <p>• Não precisa entender tudo</p>
            </div>

            <div className="mt-auto pt-6">
              <Link
                href={config.href}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-onyx shadow-sm transition-all duration-300 hover:bg-slate-100 group-hover:bg-onyx group-hover:text-white group-hover:hover:bg-slate-800"
              >
                {config.cta}
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold tracking-tight text-white transition-all duration-300 group-hover:text-slate-950">
              Missão completa!
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/60 transition-all duration-300 group-hover:text-slate-500">
              {doneCount}/5 concluído. Volte amanhã para mais prática.
            </p>
            <div className="mt-auto pt-6">
              <Link
                href="/capture"
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-onyx shadow-sm transition-all duration-300 hover:bg-slate-100 group-hover:bg-onyx group-hover:text-white group-hover:hover:bg-slate-800"
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
