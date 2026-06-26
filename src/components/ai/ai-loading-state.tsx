import { cn } from "@/lib/utils";

export function AILoadingState({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl bg-candy-blue-500/10 px-4 py-3 text-sm text-candy-blue-950", className)}>
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-candy-blue-500 opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-candy-blue-600" />
      </span>
      IA está pensando...
    </div>
  );
}
