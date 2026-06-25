import { z } from "zod";

export const sourceTypes = [
  "music",
  "video",
  "game",
  "programming",
  "conversation",
  "social_media",
  "course",
  "book",
  "routine",
  "other",
] as const;

export const difficulties = ["easy", "medium", "hard", "unknown"] as const;

export const entryStatuses = [
  "new",
  "learning",
  "practicing",
  "almost_natural",
  "mastered",
  "archived",
] as const;

export const reviewRatings = ["easy", "good", "hard", "forgot"] as const;

export const createEntrySchema = z.object({
  original_phrase: z
    .string()
    .min(2, "Preencha o campo.")
    .trim(),
  translation: z.string().trim().optional(),
  meaning_explanation: z.string().trim().optional(),
  source_type: z.enum(sourceTypes),
  source_title: z.string().trim().optional(),
  source_url: z.string().url("Use uma URL valida.").trim().optional().or(z.literal("")),
  context_note: z
    .string()
    .min(3, "Explique rapidamente onde voce usaria isso.")
    .trim(),
  difficulty: z.enum(difficulties).default("unknown"),
  chunk_text: z.string().trim().optional(),
  natural_version: z.string().trim().optional(),
  casual_version: z.string().trim().optional(),
  natural_phrase: z.string().trim().optional(),
  pronunciation_note: z.string().trim().optional(),
  grammar_note: z.string().trim().optional(),
  source_timestamp: z.string().trim().optional(),
  confidence_level: z.coerce.number().min(1).max(5).optional(),
  verb_patterns: z.array(z.string().min(1)).optional(),
  tags: z.array(z.string().min(1)).default([]),
  entry_type: z.enum(["chunk", "verb"]).default("chunk"),
});

export const createVerbSchema = z.object({
  verb: z.string().min(1, "Preencha o verbo.").trim(),
  meaning: z.string().min(1, "Preencha o significado.").trim(),
  context: z.string().min(3, "Explique onde usar.").trim(),
  verb_patterns: z.array(z.string().min(1)).optional(),
});

export const createPracticeSessionSchema = z.object({
  entry_id: z.string().uuid(),
  practice_type: z.enum(["listening", "speaking", "shadowing", "review"]),
  self_rating: z.coerce.number().min(1).max(5).optional(),
  note: z.string().trim().optional(),
  duration_seconds: z.coerce.number().min(0).optional(),
});

export const createPersonalSentenceSchema = z.object({
  entry_id: z.string().uuid(),
  chunk_id: z.string().uuid().optional(),
  sentence: z
    .string()
    .min(4, "Crie uma frase curta, mas completa.")
    .trim(),
  translation: z.string().trim().optional(),
});

export const updateEntryStatusSchema = z.object({
  entry_id: z.string().uuid(),
  status: z.enum(entryStatuses),
});

export const completeReviewSchema = z.object({
  review_id: z.string().uuid(),
  answer: z.string().min(1, "Registre sua resposta.").trim(),
  rating: z.enum(reviewRatings),
});

export type LearningActionState = {
  message?: string;
  errors?: Record<string, string[] | undefined>;
};
