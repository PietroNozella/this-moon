"use client";

import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";

  return (
    <div
      className={cn(
        "min-h-dvh",
        isDashboard
          ? "bg-candy-blue-950 text-candy-blue-500"
          : "bg-slate-50 text-onyx",
      )}
    >
      <header
        className={cn(
          "border-b",
          isDashboard
            ? "border-candy-blue-500/15 bg-onyx"
            : "border-slate-200 bg-white",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div>
            <p className="text-lg font-semibold tracking-normal text-inherit">
              ChunkFlow
            </p>
            <p
              className={cn(
                "text-sm",
                isDashboard ? "text-candy-blue-500/60" : "text-slate-500",
              )}
            >
              {user?.email ?? "Conectado"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={signOut}
              className={cn(
                isDashboard &&
                  "text-candy-blue-500/80 hover:bg-candy-blue-500/10 hover:text-candy-blue-500",
              )}
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl md:grid-cols-[220px_1fr]">
        <aside
          className={cn(
            "border-b md:min-h-[calc(100dvh-73px)] md:border-b-0 md:border-r md:px-4 md:py-5",
            isDashboard
              ? "border-candy-blue-500/15 bg-onyx"
              : "border-slate-200 bg-white",
          )}
        >
          <Navigation />
        </aside>
        <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
