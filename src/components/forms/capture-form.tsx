"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/form";
import { cn, compactText } from "@/lib/utils";
import {
  createEntrySchema,
  createVerbSchema,
  sourceTypes,
  type LearningActionState,
} from "@/lib/validators/learning";
import { createEntry, createPersonalSentence, createVerb } from "@/server/actions/learning";

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

type CaptureMode = "chunk" | "verb";

export function CaptureForm() {
  const router = useRouter();
  const [mode, setMode] = useState<CaptureMode>("chunk");
  const [state, setState] = useState<LearningActionState>({});
  const [pending, setPending] = useState(false);

  async function handleChunk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const parsed = createEntrySchema.safeParse({
      original_phrase: formData.get("original_phrase"),
      translation: compactText(formData.get("translation")) || undefined,
      source_type: formData.get("source_type"),
      context_note: formData.get("context_note"),
      entry_type: "chunk",
    });

    if (!parsed.success) {
      setState({ errors: parsed.error.flatten().fieldErrors });
      setPending(false);
      return;
    }

    try {
      const entryId = await createEntry(parsed.data);

      const mySentence = compactText(formData.get("my_sentence"));
      if (mySentence) {
        await createPersonalSentence({ entry_id: entryId, sentence: mySentence });
      }

      setState({});
      router.push(`/library/${entryId}`);
    } catch (error) {
      setState({
        message:
          error instanceof Error ? error.message : "Erro ao salvar chunk.",
      });
      setPending(false);
    }
  }

  async function handleVerb(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const parsed = createVerbSchema.safeParse({
      verb: formData.get("verb"),
      meaning: formData.get("meaning"),
      context: formData.get("context"),
    });

    if (!parsed.success) {
      setState({ errors: parsed.error.flatten().fieldErrors });
      setPending(false);
      return;
    }

    try {
      const entryId = await createVerb(parsed.data);

      const mySentence = compactText(formData.get("my_sentence"));
      if (mySentence) {
        await createPersonalSentence({ entry_id: entryId, sentence: mySentence });
      }

      setState({});
      router.push(`/library/${entryId}`);
    } catch (error) {
      setState({
        message:
          error instanceof Error ? error.message : "Erro ao salvar verbo.",
      });
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => { setMode("chunk"); setState({}); }}
          className={cn(
            "flex-1 rounded-md px-4 py-2 text-sm font-medium transition",
            mode === "chunk"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-500 hover:text-slate-950",
          )}
        >
          Chunk
        </button>
        <button
          type="button"
          onClick={() => { setMode("verb"); setState({}); }}
          className={cn(
            "flex-1 rounded-md px-4 py-2 text-sm font-medium transition",
            mode === "verb"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-500 hover:text-slate-950",
          )}
        >
          Verbo
        </button>
      </div>

      {mode === "chunk" ? (
        <form onSubmit={handleChunk} className="space-y-5">
          <CardTitle>Capturar chunk</CardTitle>

          <div className="space-y-2">
            <Label htmlFor="original_phrase">Chunk / expressão</Label>
            <Textarea id="original_phrase" name="original_phrase" required />
            <FieldError errors={state.errors?.original_phrase} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="translation">Tradução (opcional)</Label>
            <Input id="translation" name="translation" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_type">Fonte</Label>
            <Select id="source_type" name="source_type" required>
              {sourceTypes.map((source) => (
                <option key={source} value={source}>
                  {sourceLabels[source]}
                </option>
              ))}
            </Select>
            <FieldError errors={state.errors?.source_type} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context_note">Onde você usaria isso?</Label>
            <Textarea id="context_note" name="context_note" required />
            <FieldError errors={state.errors?.context_note} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="my_sentence">Sua frase (opcional)</Label>
            <Textarea id="my_sentence" name="my_sentence" />
          </div>

          {state.message ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.message}
            </p>
          ) : null}

          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            Salvar chunk
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerb} className="space-y-5">
          <CardTitle>Capturar verbo</CardTitle>

          <div className="space-y-2">
            <Label htmlFor="verb">Verbo</Label>
            <Textarea id="verb" name="verb" required />
            <FieldError errors={state.errors?.verb} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meaning">Significado</Label>
            <Input id="meaning" name="meaning" required />
            <FieldError errors={state.errors?.meaning} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Onde usar?</Label>
            <Textarea id="context" name="context" required />
            <FieldError errors={state.errors?.context} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="my_sentence">Frase de exemplo (opcional)</Label>
            <Textarea id="my_sentence" name="my_sentence" />
          </div>

          {state.message ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.message}
            </p>
          ) : null}

          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            Salvar verbo
          </Button>
        </form>
      )}
    </div>
  );
}
