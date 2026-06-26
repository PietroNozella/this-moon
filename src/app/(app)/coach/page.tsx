import { AIChat } from "@/components/ai/ai-chat";

export default function CoachPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          AI Coach
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Converse com seu coach de inglês contextual. Ele conhece seus chunks,
          verbos e seu progresso.
        </p>
      </div>
      <AIChat />
    </div>
  );
}
