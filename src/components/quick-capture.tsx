"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/form";
import { compactText } from "@/lib/utils";
import {
  quickCaptureSchema,
  sourceTypes,
  type LearningActionState,
} from "@/lib/validators/learning";
import { quickCapture } from "@/server/actions/learning";

const sourceLabels: Record<string, string> = {
  music: "Música",
  video: "Vídeo",
  game: "Jogo",
  programming: "Programação",
  conversation: "Conversa",
  social_media: "Social media",
  course: "Curso",
  book: "Livro",
  routine: "Rotina",
  other: "Outro",
};

export function QuickCapture() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<LearningActionState>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const parsed = quickCaptureSchema.safeParse({
      text: formData.get("text"),
      context: compactText(formData.get("context")),
      source: formData.get("source") || undefined,
      note: compactText(formData.get("note")),
    });

    if (!parsed.success) {
      setState({ errors: parsed.error.flatten().fieldErrors });
      setPending(false);
      return;
    }

    try {
      await quickCapture(parsed.data);
      formRef.current?.reset();
      setState({});
      setPending(false);
      router.refresh();
    } catch (error) {
      setState({
        message: error instanceof Error ? error.message : "Erro ao capturar.",
      });
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="text">Digite ou cole um chunk/frase curta em inglês</Label>
          <Textarea
            id="text"
            name="text"
            className="min-h-28"
            required
          />
          <FieldError errors={state.errors?.text} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" className="flex-1" size="lg" disabled={pending}>
            {pending ? "Capturando..." : "Capturar"}
          </Button>
        </div>

        <details className="group rounded-2xl border border-slate-200 bg-slate-50/50">
          <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 [&::-webkit-details-marker]:hidden">
            <span>Mais opções</span>
            <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-slate-200 px-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="source">Fonte (opcional)</Label>
                <Select id="source" name="source">
                  <option value="">Nenhuma</option>
                  {sourceTypes.map((source) => (
                    <option key={source} value={source}>
                      {sourceLabels[source]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="context">Onde você usaria isso? (opcional)</Label>
                <Input id="context" name="context" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Observação pessoal (opcional)</Label>
                <Textarea id="note" name="note" className="min-h-20" />
              </div>
            </div>
          </div>
        </details>
      </div>

      {state.message ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

    </form>
  );
}
