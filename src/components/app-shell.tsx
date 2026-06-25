import { ButtonLink } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div>
            <p className="text-lg font-semibold tracking-normal">ChunkFlow</p>
            <p className="text-sm text-slate-500">
              Modo local: seus dados ficam neste navegador.
            </p>
          </div>
          <ButtonLink href="/settings" variant="secondary" size="sm">
            Backup
          </ButtonLink>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl md:grid-cols-[220px_1fr]">
        <aside className="border-b border-slate-200 bg-white md:min-h-[calc(100dvh-73px)] md:border-b-0 md:border-r md:px-4 md:py-5">
          <Navigation />
          <div className="hidden px-3 pt-6 text-xs leading-5 text-slate-500 md:block">
            <p>Local-first</p>
            <p>Sem login e sem backend.</p>
          </div>
        </aside>
        <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
