import { AppShell } from "@/components/app-shell";
import { LocalStoreProvider } from "@/components/local-store-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocalStoreProvider>
      <AppShell>{children}</AppShell>
    </LocalStoreProvider>
  );
}
