"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/form";
import { compactText } from "@/lib/utils";
import {
  createEntrySchema,
  sourceTypes,
  type LearningActionState,
} from "@/lib/validators/learning";
import { createEntry } from "@/server/actions/learning";

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

export function CaptureForm() {
  const router = useRouter();
  const [state, setState] = useState<LearningActionState>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const parsed = createEntrySchema.safeParse({
      original_phrase: formData.get("original_phrase"),
      translation: compactText(formData.get("translation")) || undefined,
      source_type: formData.get("source_type"),
      context_note: formData.get("context_note"),
    });

    if (!parsed.success) {
      setState({ errors: parsed.error.flatten().fieldErrors });
      setPending(false);
      return;
    }

    try {
      const entryId = await createEntry(parsed.data);
      setState({});
      router.push(`/library/${entryId}`);
    } catch (error) {
      setState({
        message:
          error instanceof Error ? error.message : "Erro ao salvar frase.",
      });
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-5">
      <CardTitle>Capturar chunk</CardTitle>

      <div className="space-y-2">
        <Label htmlFor="original_phrase">Chunk / expressão</Label>
        <Textarea id="original_phrase" name="original_phrase" required placeholder="I need more gold." />
        <FieldError errors={state.errors?.original_phrase} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="translation">Tradução (opcional)</Label>
        <Input id="translation" name="translation" placeholder="Preciso de mais ouro." />
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
        <Textarea id="context_note" name="context_note" required placeholder="Quando estiver negociando com alguém." />
        <FieldError errors={state.errors?.context_note} />
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
  );
}
