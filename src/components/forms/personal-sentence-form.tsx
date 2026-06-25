"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/form";
import { compactText } from "@/lib/utils";
import {
  createPersonalSentenceSchema,
  type LearningActionState,
} from "@/lib/validators/learning";
import { createPersonalSentence } from "@/server/actions/learning";

export function PersonalSentenceForm({
  entryId,
  chunkId,
}: {
  entryId: string;
  chunkId?: string | null;
}) {
  const [state, setState] = useState<LearningActionState>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = createPersonalSentenceSchema.safeParse({
      entry_id: entryId,
      chunk_id: chunkId ?? undefined,
      sentence: formData.get("sentence"),
      translation: compactText(formData.get("translation")),
    });

    if (!parsed.success) {
      setState({ errors: parsed.error.flatten().fieldErrors });
      setPending(false);
      return;
    }

    try {
      await createPersonalSentence(parsed.data);
      form.reset();
      setState({});
      setPending(false);
    } catch (error) {
      setState({
        message:
          error instanceof Error ? error.message : "Erro ao criar frase.",
      });
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sentence">Sua frase usando este chunk</Label>
        <Textarea
          id="sentence"
          name="sentence"

          required
        />
        <FieldError errors={state.errors?.sentence} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="translation">Tradução (opcional)</Label>
        <Input
          id="translation"
          name="translation"

        />
      </div>

      {state.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        Salvar frase
      </Button>
    </form>
  );
}
