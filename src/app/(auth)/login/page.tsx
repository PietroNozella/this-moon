import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh bg-slate-50 px-4 py-8 md:place-items-center">
      <div className="grid w-full max-w-5xl gap-8 md:grid-cols-[1fr_440px] md:items-center">
        <section>
          <p className="text-sm font-semibold uppercase text-emerald-700">
            ChunkFlow
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-normal text-slate-950 md:text-5xl">
            Ingles falavel a partir das frases que voce ja encontra.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
            Agora em modo local-first: sem login, sem Supabase e pronto para usar
            direto no navegador.
          </p>
        </section>

        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-950">Modo local</h2>
          <p className="text-sm leading-6 text-slate-600">
            Seus dados ficam salvos no navegador via IndexedDB. Use backup JSON
            em Settings para exportar ou importar suas frases.
          </p>
          <ButtonLink href="/dashboard" className="w-full">
            Abrir ChunkFlow
          </ButtonLink>
        </Card>
      </div>
    </main>
  );
}
