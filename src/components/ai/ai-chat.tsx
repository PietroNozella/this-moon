"use client";

import { useRef, useState, type FormEvent } from "react";
import { Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AILoadingState } from "@/components/ai/ai-loading-state";
import { AIErrorState } from "@/components/ai/ai-error-state";
import { sendCoachMessage } from "@/server/actions/ai";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const quickActions = [
  { label: "Treino de hoje", message: "O que eu devo treinar hoje?" },
  { label: "Corrigir frase", message: "Me ajude a corrigir uma frase em inglês" },
  { label: "Criar roleplay", message: "Crie um roleplay curto com meus chunks" },
  { label: "Gerar frases", message: "Gere frases usando meus verbos" },
  { label: "Revisar fracos", message: "Quais chunks eu preciso revisar?" },
];

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou seu AI Coach. Pergunte o que quiser sobre seu treino de inglês ou escolha um tópico abaixo.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }, 100);
  }

  async function handleSend(content: string) {
    if (!content.trim() || loading) return;

    const userMsg: Message = { role: "user", content: content.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    setError(null);
    scrollToBottom();

    const history = updated.slice(-10, -1).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const result = await sendCoachMessage(content, history);
    setLoading(false);

    if (result.success) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.data.reply },
      ]);
      scrollToBottom();
    } else {
      setError(result.error);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void handleSend(input);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col rounded-3xl border border-slate-200 bg-white shadow-sm ring-1 ring-black/[0.02]">
      <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4">
        <span className="inline-flex items-center gap-1 rounded-full border border-candy-blue-500/30 bg-candy-blue-500/10 px-2.5 py-1 text-xs font-medium text-candy-blue-950">
          <Sparkles className="h-3 w-3" />
          AI Coach
        </span>
        <span className="text-sm text-slate-500">
          Pergunte sobre seu treino de inglês
        </span>
      </div>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-5" style={{ maxHeight: "60vh" }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                msg.role === "user"
                  ? "bg-onyx text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading ? (
          <div className="flex justify-start">
            <AILoadingState />
          </div>
        ) : null}
        {error ? (
          <AIErrorState
            message={error}
            onRetry={() => {
              const lastUser = [...messages].reverse().find((m) => m.role === "user");
              if (lastUser) void handleSend(lastUser.content);
            }}
          />
        ) : null}
      </div>

      {messages.length <= 1 ? (
        <div className="border-t border-slate-200 px-6 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Comece por aqui
          </p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={loading}
                onClick={() => void handleSend(action.message)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-3 border-t border-slate-200 px-6 py-4"
      >
        <div className="flex-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend(input);
              }
            }}
            placeholder="Pergunte algo..."
            className="min-h-[44px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
            rows={1}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={loading || !input.trim()}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
