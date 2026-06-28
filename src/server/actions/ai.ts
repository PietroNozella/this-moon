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

  const capturedEntries = Number(dailyGoal?.captured_entries ?? 0);
  const capturedVerbs = Number(dailyGoal?.captured_verbs ?? 0);
  const createdSentences = Number(dailyGoal?.personal_sentences_created ?? 0);
  const speakingPractices = Number(dailyGoal?.speaking_practices ?? 0);
  const listeningPractices = Number(dailyGoal?.listening_practices ?? 0);

  const entriesText = entries.length > 0
    ? entries.map((e, i) => {
        const conf = e.confidence_level != null ? `confiança ${e.confidence_level}` : "sem prática";
        return `${i + 1}. "${e.original_phrase}" (${e.entry_type === "verb" ? "verbo" : "chunk"}) — ${conf}`;
      }).join("\n")
    : "Nenhum chunk registrado ainda.";

  const sentencesText = sentences.length > 0
    ? sentences.map((s, i) => {
        const corrected = s.corrected_sentence ? ` → corrigido: "${s.corrected_sentence}"` : "";
        return `${i + 1}. "${s.sentence}"${corrected}`;
      }).join("\n")
    : "Nenhuma frase criada ainda.";

  const contextBlock = [
    "DADOS DO USUÁRIO:",
    "",
    `Meta de hoje: ${capturedEntries} chunks capturados, ${capturedVerbs} verbos, ${createdSentences} frases criadas, ${speakingPractices} speaking, ${listeningPractices} listening.`,
    "",
    "Chunks e verbos recentes (do mais novo para o mais antigo):",
    entriesText,
    "",
    "Frases próprias recentes:",
    sentencesText,
  ].join("\n");

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
