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
import type { PersonalSentenceRow } from "@/types/database";

type Props = {
  entryId: string;
  chunkId?: string | null;
  compact?: boolean;
  onCreated?: (sentence: PersonalSentenceRow) => void;
};

export function PersonalSentenceForm({ entryId, chunkId, compact, onCreated }: Props) {
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
      const created = await createPersonalSentence(parsed.data);
      form.reset();
      setState({});
      onCreated?.(created as PersonalSentenceRow);
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
    <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      <div className="space-y-1.5">
        <Label htmlFor="sentence" className={compact ? "text-xs uppercase tracking-[0.12em] text-slate-500" : undefined}>
          Sua frase
        </Label>
        <Textarea
          id="sentence"
          name="sentence"
          className={compact ? "min-h-16" : "min-h-20"}
          required
        />
        <FieldError errors={state.errors?.sentence} />
      </div>

      <details className="group rounded-xl border border-slate-200 bg-slate-50/70">
        <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-500 transition hover:text-slate-900 [&::-webkit-details-marker]:hidden">
          Tradução opcional
        </summary>
        <div className="border-t border-slate-200 p-3">
          <Input id="translation" name="translation" />
        </div>
      </details>

      {state.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full" size={compact ? "sm" : "md"}>
        {pending ? "Salvando..." : "Salvar frase"}
      </Button>
    </form>
  );
}