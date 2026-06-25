"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/form";
import { useLocalStore } from "@/components/local-store-provider";
import { compactText, parseCommaList } from "@/lib/utils";
import {
  createEntrySchema,
  difficulties,
  sourceTypes,
  type LearningActionState,
} from "@/lib/validators/learning";

const sourceLabels: Record<string, string> = {
  music: "Musica",
  video: "Video",
  game: "Jogo",
  programming: "Programacao",
  conversation: "Conversa",
  social_media: "Social media",
  course: "Curso",
  book: "Livro",
  routine: "Rotina",
  other: "Outro",
};

const difficultyLabels: Record<string, string> = {
  easy: "Facil",
  medium: "Medio",
  hard: "Dificil",
  unknown: "Nao sei",
};

export function CaptureForm() {
  const router = useRouter();
  const { createEntry, isLoaded } = useLocalStore();
  const [state, setState] = useState<LearningActionState>({});
  const [pending, setPending] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    const entryId = createEntry({
      ...parsed.data,
      source_url: parsed.data.source_url || undefined,
    });

    router.push(`/library/${entryId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <Card className="space-y-5">
        <div>
          <CardTitle>Captura rapida</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Salve a frase, o contexto e pelo menos um caminho para usar isso na
            sua vida.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="original_phrase">Frase original</Label>
          <Textarea
            id="original_phrase"
            name="original_phrase"
            placeholder="That makes sense."
            required
          />
          <FieldError errors={state.errors?.original_phrase} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="translation">Traducao</Label>
            <Input
              id="translation"
              name="translation"
              placeholder="Isso faz sentido."
            />
            <FieldError errors={state.errors?.translation} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chunk_text">Chunk principal</Label>
            <Input id="chunk_text" name="chunk_text" placeholder="makes sense" />
            <FieldError errors={state.errors?.chunk_text} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="natural_version">Versao natural</Label>
            <Input
              id="natural_version"
              name="natural_version"
              placeholder="That makes sense."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="casual_version">Versao falada</Label>
            <Input
              id="casual_version"
              name="casual_version"
              placeholder="Yeah, makes sense."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meaning_explanation">Explicacao simples</Label>
          <Textarea
            id="meaning_explanation"
            name="meaning_explanation"
            placeholder="Use quando algo fica claro ou parece logico."
          />
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
            <Label htmlFor="context_note">Onde voce usaria?</Label>
            <Textarea
              id="context_note"
              name="context_note"
              placeholder="Quando eu entendo uma explicacao de codigo."
              required
            />
            <FieldError errors={state.errors?.context_note} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_title">Titulo da fonte</Label>
            <Input
              id="source_title"
              name="source_title"
              placeholder="React tutorial"
            />
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
              <Input
                id="tags"
                name="tags"
                placeholder="music, casual, routine"
              />
            </div>
          </div>
        </Card>

        {state.message ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={pending || !isLoaded}>
          Salvar frase
        </Button>
      </div>
    </form>
  );
}
