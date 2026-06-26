import { cn } from "@/lib/utils";

export function AIErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-red-200 bg-red-50 px-4 py-3", className)}>
      <p className="text-sm text-red-700">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-sm font-medium text-red-600 hover:text-red-800 hover:underline"
        >
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}
