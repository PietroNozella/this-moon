"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateAIResponse } from "@/lib/ai/provider";
import {
  CAPTURE_ASSIST_CHUNK_PROMPT,
  CAPTURE_ASSIST_VERB_PROMPT,
  SENTENCE_FEEDBACK_PROMPT,
  DAILY_COACH_PROMPT,
  SPEAKING_PRACTICE_PROMPT,
  LISTENING_HELPER_PROMPT,
  REVIEW_GENERATOR_PROMPT,
  ENTRY_HELPER_PROMPTS,
  COACH_CHAT_SYSTEM_PROMPT,
} from "@/lib/ai/prompts";
import {
  captureAssistChunkSchema,
  captureAssistVerbSchema,
  sentenceFeedbackSchema,
  dailyCoachSchema,
  speakingPracticeSchema,
  listeningHelperSchema,
  reviewGeneratorSchema,
  entryExplainSchema,
  entrySentencesSchema,
  entryRoleplaySchema,
} from "@/lib/ai/schemas";
import type { AiInteractionInsert } from "@/types/database";

type ActionResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

async function logInteraction(
  userId: string,
  feature: string,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  relatedEntryId?: string,
) {
  const supabase = await createClient();
  const interaction: AiInteractionInsert = {
    user_id: userId,
    feature,
    input: input as AiInteractionInsert["input"],
    output: output as AiInteractionInsert["output"],
    related_entry_id: relatedEntryId ?? null,
  };
  await supabase.from("ai_interactions").insert(interaction);
}

function parseJSON(raw: string): Record<string, unknown> | null {
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function generateCaptureAssist(
  input: {
    entryType: "chunk" | "verb";
    originalPhrase: string;
    sourceType?: string;
    sourceTitle?: string;
    contextNote?: string;
  },
): Promise<ActionResult<
  | z.infer<typeof captureAssistChunkSchema>
  | z.infer<typeof captureAssistVerbSchema>
>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autorizado." };

  const prompt =
    input.entryType === "chunk"
      ? CAPTURE_ASSIST_CHUNK_PROMPT
      : CAPTURE_ASSIST_VERB_PROMPT;

  const userContent = [
    `Frase: "${input.originalPhrase}"`,
    input.sourceType ? `Fonte: ${input.sourceType}` : null,
    input.sourceTitle ? `Título: ${input.sourceTitle}` : null,
    input.contextNote ? `Contexto: ${input.contextNote}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await generateAIResponse([
      { role: "system", content: prompt },
      { role: "user", content: userContent },
    ]);

    const parsed = parseJSON(response.content);
    if (!parsed) {
      return { success: false, error: "Resposta inválida da IA." };
    }

    const schema =
      input.entryType === "chunk"
        ? captureAssistChunkSchema
        : captureAssistVerbSchema;

    const validated = schema.safeParse(parsed);
    if (!validated.success) {
      return { success: false, error: "Resposta da IA não seguiu o formato esperado." };
    }

    await logInteraction(
      user.id,
      `capture_assist_${input.entryType}`,
      input as unknown as Record<string, unknown>,
      parsed,
    );

    return { success: true, data: validated.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao chamar IA.",
    };
  }
}

export async function generateSentenceFeedback(
  input: {
    sentenceId: string;
    sentence: string;
    relatedEntryId?: string;
  },
): Promise<ActionResult<z.infer<typeof sentenceFeedbackSchema>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autorizado." };

  const userContent = [
    `Frase do usuário: "${input.sentence}"`,
    input.relatedEntryId ? `EntryId: ${input.relatedEntryId}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await generateAIResponse([
      { role: "system", content: SENTENCE_FEEDBACK_PROMPT },
      { role: "user", content: userContent },
    ]);

    const parsed = parseJSON(response.content);
    if (!parsed) {
      return { success: false, error: "Resposta inválida da IA." };
    }

    const validated = sentenceFeedbackSchema.safeParse(parsed);
    if (!validated.success) {
      return { success: false, error: "Resposta da IA não seguiu o formato esperado." };
    }

    // Salvar correção no banco
    await supabase
      .from("personal_sentences")
      .update({
        corrected_sentence: validated.data.correctedSentence,
        natural_sentence: validated.data.naturalSentence,
        ai_feedback: validated.data.feedbackPtBr,
        status: "reviewed",
      })
      .eq("id", input.sentenceId)
      .eq("user_id", user.id);

    await logInteraction(
      user.id,
      "sentence_feedback",
      { sentenceId: input.sentenceId, sentence: input.sentence },
      parsed,
      input.relatedEntryId,
    );

    return { success: true, data: validated.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao chamar IA.",
    };
  }
}

export async function generateDailyCoach(): Promise<
  ActionResult<z.infer<typeof dailyCoachSchema>>
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autorizado." };

  const today = new Date().toISOString().slice(0, 10);

  const [goalRes, entriesRes, personalRes] = await Promise.all([
    supabase.from("daily_goals").select("*").eq("goal_date", today).eq("user_id", user.id).maybeSingle(),
    supabase
      .from("learning_entries")
      .select("id, original_phrase, entry_type, confidence_level, times_practiced")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("personal_sentences")
      .select("id, sentence, entry_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const dailyGoal = goalRes.data as Record<string, unknown> | null;
  const entries = (entriesRes.data ?? []) as Array<{
    id: string;
    original_phrase: string;
    entry_type: string;
    confidence_level: number | null;
    times_practiced: number | null;
  }>;
  const recentSentences = (personalRes.data ?? []) as Array<{
    id: string;
    sentence: string;
    entry_id: string | null;
  }>;

  const weakEntries = entries.filter(
    (e) => (e.confidence_level ?? 0) <= 2 && (e.times_practiced ?? 0) < 3,
  );
  const unpracticed = entries.filter((e) => (e.times_practiced ?? 0) === 0);

  const context = {
    todayGoal: {
      captured_entries: Number(dailyGoal?.captured_entries ?? 0),
      captured_verbs: Number(dailyGoal?.captured_verbs ?? 0),
      personal_sentences_created: Number(dailyGoal?.personal_sentences_created ?? 0),
      listening_practices: Number(dailyGoal?.listening_practices ?? 0),
      speaking_practices: Number(dailyGoal?.speaking_practices ?? 0),
    },
    recentEntries: entries.slice(0, 5).map((e) => ({
      id: e.id,
      originalPhrase: e.original_phrase,
      entryType: e.entry_type,
      confidenceLevel: e.confidence_level,
      timesPracticed: e.times_practiced,
    })),
    weakEntries: weakEntries.slice(0, 5).map((e) => e.original_phrase),
    unpracticedEntries: unpracticed.slice(0, 5).map((e) => e.original_phrase),
    recentSentencesCount: recentSentences.length,
  };

  try {
    const response = await generateAIResponse([
      { role: "system", content: DAILY_COACH_PROMPT },
      { role: "user", content: JSON.stringify(context, null, 2) },
    ]);

    const parsed = parseJSON(response.content);
    if (!parsed) {
      return { success: false, error: "Resposta inválida da IA." };
    }

    const validated = dailyCoachSchema.safeParse(parsed);
    if (!validated.success) {
      return { success: false, error: "Resposta da IA não seguiu o formato esperado." };
    }

    await logInteraction(user.id, "daily_coach", context as unknown as Record<string, unknown>, parsed);

    return { success: true, data: validated.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao chamar IA.",
    };
  }
}

export async function sendCoachMessage(
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<ActionResult<{ reply: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autorizado." };

  const today = new Date().toISOString().slice(0, 10);

  const [goalRes, entriesRes, personalRes] = await Promise.all([
    supabase.from("daily_goals").select("*").eq("goal_date", today).eq("user_id", user.id).maybeSingle(),
    supabase
      .from("learning_entries")
      .select("id, original_phrase, entry_type, confidence_level, times_practiced")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("personal_sentences")
      .select("sentence, corrected_sentence")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const dailyGoal = goalRes.data as Record<string, unknown> | null;
  const entries = (entriesRes.data ?? []) as Array<{
    original_phrase: string; entry_type: string; confidence_level: number | null;
  }>;
  const sentences = (personalRes.data ?? []) as Array<{
    sentence: string; corrected_sentence: string | null;
  }>;

  const context = {
    todayGoal: {
      captured_entries: Number(dailyGoal?.captured_entries ?? 0),
      captured_verbs: Number(dailyGoal?.captured_verbs ?? 0),
      personal_sentences_created: Number(dailyGoal?.personal_sentences_created ?? 0),
      speaking_practices: Number(dailyGoal?.speaking_practices ?? 0),
      listening_practices: Number(dailyGoal?.listening_practices ?? 0),
    },
    recentEntries: entries.map((e) => ({
      phrase: e.original_phrase,
      type: e.entry_type,
      confidence: e.confidence_level,
    })),
    recentSentences: sentences.map((s) => ({
      original: s.sentence,
      corrected: s.corrected_sentence,
    })),
  };

  const contextBlock = `Contexto do usuário:\n${JSON.stringify(context, null, 2)}`;

  try {
    const response = await generateAIResponse([
      { role: "system", content: `${COACH_CHAT_SYSTEM_PROMPT}\n\n${contextBlock}` },
      ...history,
      { role: "user", content: message },
    ]);

    await logInteraction(
      user.id,
      "coach_chat",
      { message, historyLength: history.length },
      { reply: response.content },
    );

    return { success: true, data: { reply: response.content } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao chamar IA.",
    };
  }
}

export async function generateEntryHelper(
  entryId: string,
  action: "explain" | "sentences" | "roleplay",
): Promise<ActionResult<Record<string, unknown>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autorizado." };

  const { data: entry } = await supabase
    .from("learning_entries")
    .select("original_phrase, entry_type, translation, context_note")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single();

  if (!entry) return { success: false, error: "Entrada não encontrada." };

  const schemaMap: Record<string, z.ZodTypeAny> = {
    explain: entryExplainSchema,
    sentences: entrySentencesSchema,
    roleplay: entryRoleplaySchema,
  };

  const prompt = ENTRY_HELPER_PROMPTS[action];
  if (!prompt) return { success: false, error: "Ação inválida." };

  const userContent = [
    `Frase/chunk: "${entry.original_phrase}"`,
    entry.translation ? `Tradução: ${entry.translation}` : null,
    entry.context_note ? `Contexto: ${entry.context_note}` : null,
    `Tipo: ${entry.entry_type}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await generateAIResponse([
      { role: "system", content: prompt },
      { role: "user", content: userContent },
    ]);

    const parsed = parseJSON(response.content);
    if (!parsed) {
      return { success: false, error: "Resposta inválida da IA." };
    }

    const schema = schemaMap[action];
    const validated = schema.safeParse(parsed);
    if (!validated.success) {
      return { success: false, error: "Resposta da IA não seguiu o formato esperado." };
    }

    await logInteraction(user.id, `entry_helper_${action}`, { entryId, action }, parsed, entryId);

    return { success: true, data: validated.data as unknown as Record<string, unknown> };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao chamar IA.",
    };
  }
}

export async function generateSpeakingPractice(): Promise<
  ActionResult<z.infer<typeof speakingPracticeSchema>>
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autorizado." };

  const { data: entries } = await supabase
    .from("learning_entries")
    .select("original_phrase, entry_type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const recent = (entries ?? []).map((e) => e.original_phrase).join("\n");
  const userContent = `Frases recentes do usuário:\n${recent || "Nenhuma frase salva ainda."}`;

  try {
    const response = await generateAIResponse([
      { role: "system", content: SPEAKING_PRACTICE_PROMPT },
      { role: "user", content: userContent },
    ]);

    const parsed = parseJSON(response.content);
    if (!parsed) return { success: false, error: "Resposta inválida da IA." };

    const validated = speakingPracticeSchema.safeParse(parsed);
    if (!validated.success) {
      return { success: false, error: "Resposta da IA não seguiu o formato esperado." };
    }

    await logInteraction(user.id, "speaking_practice", {}, parsed);
    return { success: true, data: validated.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao chamar IA.",
    };
  }
}

export async function generateListeningHelper(
  entryId: string,
): Promise<ActionResult<z.infer<typeof listeningHelperSchema>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autorizado." };

  const { data: entry } = await supabase
    .from("learning_entries")
    .select("original_phrase, translation, context_note")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single();

  if (!entry) return { success: false, error: "Entrada não encontrada." };

  const userContent = `Frase: "${entry.original_phrase}"${entry.translation ? `\nTradução: ${entry.translation}` : ""}${entry.context_note ? `\nContexto: ${entry.context_note}` : ""}`;

  try {
    const response = await generateAIResponse([
      { role: "system", content: LISTENING_HELPER_PROMPT },
      { role: "user", content: userContent },
    ]);

    const parsed = parseJSON(response.content);
    if (!parsed) return { success: false, error: "Resposta inválida da IA." };

    const validated = listeningHelperSchema.safeParse(parsed);
    if (!validated.success) {
      return { success: false, error: "Resposta da IA não seguiu o formato esperado." };
    }

    await logInteraction(user.id, "listening_helper", { entryId }, parsed, entryId);
    return { success: true, data: validated.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao chamar IA.",
    };
  }
}

export async function generateReviewPlan(): Promise<
  ActionResult<z.infer<typeof reviewGeneratorSchema>>
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autorizado." };

  const { data: entries } = await supabase
    .from("learning_entries")
    .select("id, original_phrase, entry_type, confidence_level, times_practiced, created_at")
    .eq("user_id", user.id)
    .order("times_practiced", { ascending: true })
    .order("confidence_level", { ascending: true })
    .limit(15);

  const entriesList = (entries ?? []).map((e) => ({
    id: e.id,
    phrase: e.original_phrase,
    type: e.entry_type,
    confidence: e.confidence_level ?? 0,
    practiced: e.times_practiced ?? 0,
  }));

  try {
    const response = await generateAIResponse([
      { role: "system", content: REVIEW_GENERATOR_PROMPT },
      { role: "user", content: JSON.stringify({ entries: entriesList }, null, 2) },
    ]);

    const parsed = parseJSON(response.content);
    if (!parsed) return { success: false, error: "Resposta inválida da IA." };

    const validated = reviewGeneratorSchema.safeParse(parsed);
    if (!validated.success) {
      return { success: false, error: "Resposta da IA não seguiu o formato esperado." };
    }

    await logInteraction(user.id, "review_plan", {}, parsed);
    return { success: true, data: validated.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao chamar IA.",
    };
  }
}
