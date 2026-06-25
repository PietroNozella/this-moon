"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/form";
import { compactText, parseCommaList } from "@/lib/utils";
import {
  createEntrySchema,
  difficulties,
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

const difficultyLabels: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
  unknown: "Não sei",
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
      translation: compactText(formData.get("translation")),
      meaning_explanation: compactText(formData.get("meaning_explanation")),
      source_type: formData.get("source_type"),
      source_title: compactText(formData.get("source_title")),
      source_url: compactText(formData.get("source_url")) ?? "",
      context_note: formData.get("context_note"),
      difficulty: formData.get("difficulty") || "unknown",
      chunk_text: compactText(formData.get("chunk_text")),
      natural_version: compactText(formData.get("natural_version")),
      casual_version: compactText(formData.get("casual_version")),
      tags: parseCommaList(formData.get("tags")),
    });

    if (!parsed.success) {
      setState({ errors: parsed.error.flatten().fieldErrors });
      setPending(false);
      return;
    }

    try {
      const entryId = await createEntry({
        ...parsed.data,
        source_url: parsed.data.source_url || undefined,
      });

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
    <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <Card className="space-y-5">
        <CardTitle>Captura rápida</CardTitle>

        <div className="space-y-2">
          <Label htmlFor="original_phrase">Frase original</Label>
          <Textarea id="original_phrase" name="original_phrase" required />
          <FieldError errors={state.errors?.original_phrase} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="translation">Tradução</Label>
            <Input id="translation" name="translation" />
            <FieldError errors={state.errors?.translation} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chunk_text">Chunk principal</Label>
            <Input id="chunk_text" name="chunk_text" />
            <FieldError errors={state.errors?.chunk_text} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="natural_version">Versão natural</Label>
            <Input id="natural_version" name="natural_version" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="casual_version">Versão falada</Label>
            <Input id="casual_version" name="casual_version" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meaning_explanation">Explicação simples</Label>
          <Textarea id="meaning_explanation" name="meaning_explanation" />
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="space-y-4">
          <CardTitle>Origem e contexto</CardTitle>

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
            <Label htmlFor="context_note">Onde você usaria?</Label>
            <Textarea id="context_note" name="context_note" required />
            <FieldError errors={state.errors?.context_note} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_title">Título da fonte</Label>
            <Input id="source_title" name="source_title" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_url">Link</Label>
            <Input id="source_url" name="source_url" type="url" />
            <FieldError errors={state.errors?.source_url} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificuldade</Label>
              <Select id="difficulty" name="difficulty" defaultValue="unknown">
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficultyLabels[difficulty]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" name="tags" />
            </div>
          </div>
        </Card>

        {state.message ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          Salvar frase
        </Button>
      </div>
    </form>
  );
}
