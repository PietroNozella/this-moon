"use client";

import { useAuth } from "@/components/auth-provider";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-dvh bg-slate-100 text-onyx">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4">
          <div>
            <p className="text-lg font-semibold tracking-tight text-onyx">ChunkFlow</p>
            <p className="text-xs text-slate-500">
              {user?.email ?? "Conectado"}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={signOut}>
            Sair
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl md:grid-cols-[256px_1fr]">
        <aside className="border-b border-slate-200 bg-white md:min-h-[calc(100dvh-65px)] md:border-b-0 md:border-r md:px-3 md:py-6">
          <Navigation />
        </aside>
        <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
