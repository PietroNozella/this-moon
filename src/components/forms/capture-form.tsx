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
  difficulties,
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

const difficultyLabels: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
  unknown: "Não sei",
};

type CaptureMode = "chunk" | "verb";

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

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
      source_title: compactText(formData.get("source_title")) || undefined,
      source_url: formData.get("source_url") || undefined,
      source_timestamp: compactText(formData.get("source_timestamp")) || undefined,
      natural_phrase: compactText(formData.get("natural_phrase")) || undefined,
      pronunciation_note: compactText(formData.get("pronunciation_note")) || undefined,
      grammar_note: compactText(formData.get("grammar_note")) || undefined,
      difficulty: formData.get("difficulty") || undefined,
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
        message: error instanceof Error ? error.message : "Erro ao salvar chunk.",
      });
      setPending(false);
    }
  }

  async function handleVerb(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const patternsRaw = compactText(formData.get("verb_patterns")) || "";
    const verbPatterns = patternsRaw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const parsed = createVerbSchema.safeParse({
      verb: formData.get("verb"),
      meaning: formData.get("meaning"),
      context: formData.get("context"),
      verb_patterns: verbPatterns.length > 0 ? verbPatterns : undefined,
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
        message: error instanceof Error ? error.message : "Erro ao salvar verbo.",
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
              ? "bg-white text-onyx shadow-sm"
              : "text-slate-500 hover:text-onyx",
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
              ? "bg-white text-onyx shadow-sm"
              : "text-slate-500 hover:text-onyx",
          )}
        >
          Verbo
        </button>
      </div>

      {mode === "chunk" ? (
        <form onSubmit={handleChunk} className="space-y-4">
          <CardTitle>Capturar chunk</CardTitle>

          <FormSection title="Frase">
            <div className="space-y-2">
              <Label htmlFor="original_phrase">Frase original</Label>
              <Textarea id="original_phrase" name="original_phrase" required />
              <p className="text-xs text-slate-400">
                Salve como você encontrou.
              </p>
              <FieldError errors={state.errors?.original_phrase} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="translation">Tradução (opcional)</Label>
              <Input id="translation" name="translation" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="natural_phrase">Versão natural (opcional)</Label>
              <Textarea id="natural_phrase" name="natural_phrase" />
              <p className="text-xs text-slate-400">
                Ex: "I am going to" vira "I'm gonna" na fala casual.
              </p>
            </div>
          </FormSection>

          <FormSection title="Fonte">
            <div className="space-y-2">
              <Label htmlFor="source_type">Tipo da fonte</Label>
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
              <Label htmlFor="source_title">Título (opcional)</Label>
              <Input id="source_title" name="source_title" placeholder="Ex: Post Malone — Circles" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source_url">Link (opcional)</Label>
              <Input id="source_url" name="source_url" type="url" placeholder="https://" />
              <FieldError errors={state.errors?.source_url} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source_timestamp">Tempo / trecho (opcional)</Label>
              <Input id="source_timestamp" name="source_timestamp" placeholder="Ex: 00:42 - 00:55" />
            </div>
          </FormSection>

          <FormSection title="Uso real">
            <div className="space-y-2">
              <Label htmlFor="context_note">Onde você usaria isso?</Label>
              <Textarea id="context_note" name="context_note" required />
              <FieldError errors={state.errors?.context_note} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="my_sentence">Sua frase (opcional)</Label>
              <Textarea id="my_sentence" name="my_sentence" />
            </div>
          </FormSection>

          <FormSection title="Fala e pronúncia">
            <div className="space-y-2">
              <Label htmlFor="pronunciation_note">Nota de pronúncia (opcional)</Label>
              <Textarea id="pronunciation_note" name="pronunciation_note" />
              <p className="text-xs text-slate-400">
                Reduções (gonna, wanna), connected speech ou partes difíceis.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grammar_note">Observação (opcional)</Label>
              <Textarea id="grammar_note" name="grammar_note" />
              <p className="text-xs text-slate-400">
                Ex: "I'm trying to..." é usado para algo que você está tentando agora.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificuldade</Label>
              <Select id="difficulty" name="difficulty">
                {difficulties.map((d) => (
                  <option key={d} value={d}>
                    {difficultyLabels[d]}
                  </option>
                ))}
              </Select>
            </div>
          </FormSection>

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
        <form onSubmit={handleVerb} className="space-y-4">
          <CardTitle>Capturar verbo</CardTitle>

          <FormSection title="Verbo">
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
          </FormSection>

          <FormSection title="Uso real">
            <div className="space-y-2">
              <Label htmlFor="context">Onde usar?</Label>
              <Textarea id="context" name="context" required />
              <FieldError errors={state.errors?.context} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="my_sentence">Frase de exemplo (opcional)</Label>
              <Textarea id="my_sentence" name="my_sentence" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="verb_patterns">Padrões úteis com este verbo (opcional)</Label>
              <Textarea id="verb_patterns" name="verb_patterns" />
              <p className="text-xs text-slate-400">
                Um padrão por linha. Ex: "get better", "get ready"
              </p>
            </div>
          </FormSection>

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
