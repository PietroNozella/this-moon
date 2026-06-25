"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/form";
import { useLocalStore } from "@/components/local-store-provider";
import { compactText } from "@/lib/utils";
import {
  createPersonalSentenceSchema,
  type LearningActionState,
} from "@/lib/validators/learning";

export function PersonalSentenceForm({
  entryId,
  chunkId,
}: {
  entryId: string;
  chunkId?: string | null;
}) {
  const { createPersonalSentence } = useLocalStore();
  const [state, setState] = useState<LearningActionState>({});
  const [pending, setPending] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    createPersonalSentence(parsed.data);
    form.reset();
    setState({});
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sentence">Como voce usaria isso na sua vida?</Label>
        <Textarea
          id="sentence"
          name="sentence"
          placeholder="I need to fix this bug."
          required
        />
        <FieldError errors={state.errors?.sentence} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="translation">Traducao opcional</Label>
        <Input
          id="translation"
          name="translation"
          placeholder="Eu preciso corrigir esse bug."
        />
      </div>

      {state.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        Criar frase minha
      </Button>
    </form>
  );
}
