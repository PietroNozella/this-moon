"use server";

import { createClient } from "@/lib/supabase/server";
import { generateAIResponse } from "@/lib/ai/provider";
import { COACH_CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
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
