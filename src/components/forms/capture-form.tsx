"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/form";
import { AILoadingState } from "@/components/ai/ai-loading-state";
import { AIErrorState } from "@/components/ai/ai-error-state";
import { cn, compactText } from "@/lib/utils";
import {
  createEntrySchema,
  createVerbSchema,
  difficulties,
  sourceTypes,
  type LearningActionState,
} from "@/lib/validators/learning";
import { createEntry, createPersonalSentence, createVerb } from "@/server/actions/learning";
import { generateCaptureAssist } from "@/server/actions/ai";

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

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>
      {subtitle ? (
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      ) : null}
    </div>
  );
}

function CollapsibleSection({
  title,
  subtitle,
  defaultOpen,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      className="group rounded-2xl border border-slate-200 bg-slate-50/50"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-slate-700 transition-colors hover:text-slate-950 [&::-webkit-details-marker]:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>
          ) : null}
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-slate-200 px-5 py-4">
        <div className="space-y-4">{children}</div>
      </div>
    </details>
  );
}

export function CaptureForm() {
  const router = useRouter();
  const chunkFormRef = useRef<HTMLFormElement>(null);
  const verbFormRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<CaptureMode>("chunk");
  const [state, setState] = useState<LearningActionState>({});
  const [pending, setPending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  function setFieldValue(
    form: HTMLFormElement | null,
    name: string,
    value: string,
  ) {
    if (!form) return;
    const field = form.elements.namedItem(name) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
      | null;
    if (field) field.value = value;
  }

  async function handleAIAssist() {
    const form = mode === "chunk" ? chunkFormRef.current : verbFormRef.current;
    if (!form) return;

    const formData = new FormData(form);
    const originalPhrase = compactText(
      formData.get(mode === "chunk" ? "original_phrase" : "verb"),
    );
    if (!originalPhrase) return;

    setAiLoading(true);
    setAiError(null);

    const result = await generateCaptureAssist({
      entryType: mode,
      originalPhrase,
      sourceType:
        compactText(formData.get("source_type")) ?? undefined,
      sourceTitle:
        compactText(formData.get("source_title")) ?? undefined,
      contextNote:
        compactText(formData.get("context_note")) ?? undefined,
    });

    setAiLoading(false);

    if (!result.success) {
      setAiError(result.error);
      return;
    }

    const data = result.data;

    if (mode === "chunk") {
      if ("translation" in data && data.translation) {
        setFieldValue(chunkFormRef.current, "translation", data.translation);
      }
      if ("naturalPhrase" in data && data.naturalPhrase) {
        setFieldValue(chunkFormRef.current, "natural_phrase", data.naturalPhrase);
      }
      if ("pronunciationNote" in data && data.pronunciationNote) {
        setFieldValue(chunkFormRef.current, "pronunciation_note", data.pronunciationNote);
      }
      if ("grammarNote" in data && data.grammarNote) {
        setFieldValue(chunkFormRef.current, "grammar_note", data.grammarNote);
      }
      if ("difficulty" in data && data.difficulty) {
        setFieldValue(chunkFormRef.current, "difficulty", data.difficulty);
      }
    } else {
      if ("translation" in data && data.translation) {
        setFieldValue(verbFormRef.current, "meaning", data.translation);
      }
      if ("verbPatterns" in data && data.verbPatterns) {
        setFieldValue(
          verbFormRef.current,
          "verb_patterns",
          data.verbPatterns.join("\n"),
        );
      }
      if ("difficulty" in data && data.difficulty) {
        setFieldValue(verbFormRef.current, "difficulty", data.difficulty);
      }
    }
  }

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

    const contextsRaw = compactText(formData.get("usage_contexts")) || "";
    const usageContexts = contextsRaw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const parsed = createVerbSchema.safeParse({
      verb: formData.get("verb"),
      meaning: formData.get("meaning"),
      context: formData.get("context"),
      verb_patterns: verbPatterns.length > 0 ? verbPatterns : undefined,
      difficulty: formData.get("difficulty") || undefined,
      usageContexts: usageContexts.length > 0 ? usageContexts : undefined,
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
    <div className="space-y-6">
      {/* Toggle */}
      <div className="inline-flex rounded-2xl bg-slate-100 p-1 ring-1 ring-slate-200">
        <button
          type="button"
          onClick={() => { setMode("chunk"); setState({}); }}
          className={cn(
            "rounded-xl px-8 py-3 text-sm font-medium transition",
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
            "rounded-xl px-8 py-3 text-sm font-medium transition",
            mode === "verb"
              ? "bg-white text-onyx shadow-sm"
              : "text-slate-500 hover:text-onyx",
          )}
        >
          Verbo
        </button>
      </div>

      {mode === "chunk" ? (
        <form ref={chunkFormRef} onSubmit={handleChunk} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex items-start justify-between gap-4">
            <SectionHeading title="Capturar chunk" subtitle="Salve uma frase curta que você encontrou e quer reconhecer, repetir e usar." />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={aiLoading}
              onClick={handleAIAssist}
              className="shrink-0 gap-1.5 text-candy-blue-700 hover:text-candy-blue-950"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Melhorar com IA
            </Button>
          </div>

          {aiLoading ? <AILoadingState /> : null}
          {aiError ? <AIErrorState message={aiError} onRetry={handleAIAssist} /> : null}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="original_phrase">Frase original</Label>
              <Textarea id="original_phrase" name="original_phrase" className="min-h-28" required />
              <FieldError errors={state.errors?.original_phrase} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="translation">Tradução (opcional)</Label>
                <Input id="translation" name="translation" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="natural_phrase">Versão natural (opcional)</Label>
                <Input id="natural_phrase" name="natural_phrase" />
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <SectionHeading title="Fonte e contexto" subtitle="Anote de onde veio e onde você usaria." />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                <Label htmlFor="context_note">Onde você usaria isso?</Label>
                <Input id="context_note" name="context_note" required />
                <FieldError errors={state.errors?.context_note} />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="my_sentence">Sua frase (opcional)</Label>
              <Textarea id="my_sentence" name="my_sentence" />
            </div>

            <p className="mt-3 text-xs text-slate-400">Contexto é mais importante que tradução perfeita.</p>
          </div>

          <div className="mt-6">
            <CollapsibleSection title="Detalhes opcionais" subtitle="Preencha só se isso ajudar seu treino.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="source_title">Título da fonte</Label>
                  <Input id="source_title" name="source_title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source_url">Link</Label>
                  <Input id="source_url" name="source_url" type="url" />
                  <FieldError errors={state.errors?.source_url} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source_timestamp">Tempo / trecho</Label>
                  <Input id="source_timestamp" name="source_timestamp" />
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
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor="pronunciation_note">Nota de pronúncia</Label>
                <Textarea id="pronunciation_note" name="pronunciation_note" className="min-h-24" />
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor="grammar_note">Observação</Label>
                <Textarea id="grammar_note" name="grammar_note" className="min-h-24" />
              </div>
            </CollapsibleSection>
          </div>

          {state.message ? (
            <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.message}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              Chunk = frase para reconhecer e repetir.
            </p>
            <Button type="submit" className="w-full sm:w-auto min-w-44" size="lg" disabled={pending}>
              Salvar chunk
            </Button>
          </div>
        </form>
      ) : (
        <form ref={verbFormRef} onSubmit={handleVerb} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex items-start justify-between gap-4">
            <SectionHeading title="Capturar verbo" subtitle="Salve um verbo para criar padrões e montar frases próprias com ele." />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={aiLoading}
              onClick={handleAIAssist}
              className="shrink-0 gap-1.5 text-candy-blue-700 hover:text-candy-blue-950"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Melhorar com IA
            </Button>
          </div>

          {aiLoading ? <AILoadingState /> : null}
          {aiError ? <AIErrorState message={aiError} onRetry={handleAIAssist} /> : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="verb">Verbo base</Label>
              <Input id="verb" name="verb" required />
              <FieldError errors={state.errors?.verb} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meaning">Significado</Label>
              <Input id="meaning" name="meaning" required />
              <FieldError errors={state.errors?.meaning} />
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <SectionHeading title="Uso e padrões" subtitle="Explique quando usar e liste os padrões principais com este verbo." />

            <div className="space-y-2">
              <Label htmlFor="context">Quando usar?</Label>
              <Textarea id="context" name="context" required />
              <FieldError errors={state.errors?.context} />
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="verb_patterns">Padrões com este verbo</Label>
              <Textarea id="verb_patterns" name="verb_patterns" rows={6} />
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="my_sentence">Frases suas com este verbo (opcional)</Label>
              <Textarea id="my_sentence" name="my_sentence" rows={4} />
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="usage_contexts">Onde você quer usar este verbo?</Label>
              <Textarea id="usage_contexts" name="usage_contexts" rows={3} />
            </div>
          </div>

          <div className="mt-6">
            <CollapsibleSection title="Dificuldade" subtitle="Apenas se quiser classificar agora.">
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
            </CollapsibleSection>
          </div>

          {state.message ? (
            <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.message}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              Verbo = base para construir frases.
            </p>
            <Button type="submit" className="w-full sm:w-auto min-w-44" size="lg" disabled={pending}>
              Salvar verbo
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
