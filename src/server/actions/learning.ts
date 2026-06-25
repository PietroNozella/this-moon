"use server";

import { createClient } from "@/lib/supabase/server";

function todayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function nextIntervalDays(current: number, rating: string) {
  const intervals = [0, 1, 3, 7, 15, 30];

  if (rating === "forgot") return 0;
  if (rating === "hard") return Math.max(1, Math.min(current, 1));

  const currentIndex = intervals.findIndex((item) => item >= current);

  if (rating === "easy") {
    return intervals[Math.min(currentIndex + 2, intervals.length - 1)] ?? 30;
  }

  return intervals[Math.min(currentIndex + 1, intervals.length - 1)] ?? 30;
}

async function ensureTag(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  name: string,
) {
  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .eq("user_id", userId)
    .eq("name", name)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("tags")
    .insert({ user_id: userId, name })
    .select("id")
    .maybeSingle();

  return created!.id;
}

async function incrementDailyGoal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  field: "captured_entries" | "reviews_completed" | "personal_sentences_created" | "speaking_practices",
) {
  const today = todayISO();

  const { data: existing } = await supabase
    .from("daily_goals")
    .select("*")
    .eq("user_id", userId)
    .eq("goal_date", today)
    .maybeSingle();

  const currentValue = existing ? Number((existing as Record<string, unknown>)[field] ?? 0) : 0;

  if (existing) {
    await supabase
      .from("daily_goals")
      .update({ [field]: currentValue + 1 })
      .eq("user_id", userId)
      .eq("goal_date", today);
  } else {
    await supabase
      .from("daily_goals")
      .insert({ user_id: userId, goal_date: today, [field]: 1 });
  }
}

export async function createEntry(input: {
  original_phrase: string;
  translation?: string;
  meaning_explanation?: string;
  source_type: string;
  source_title?: string;
  source_url?: string;
  context_note: string;
  difficulty: string;
  chunk_text?: string;
  natural_version?: string;
  casual_version?: string;
  tags: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado.");

  const { data: entry, error: entryError } = await supabase
    .from("learning_entries")
    .insert({
      user_id: user.id,
      original_phrase: input.original_phrase,
      translation: input.translation ?? null,
      meaning_explanation: input.meaning_explanation ?? null,
      source_type: input.source_type,
      source_title: input.source_title ?? null,
      source_url: input.source_url ?? null,
      context_note: input.context_note,
      difficulty: input.difficulty,
    })
    .select("id")
    .maybeSingle();

  if (entryError || !entry) throw entryError ?? new Error("Falha ao criar entrada.");

  if (input.chunk_text) {
    const { error: chunkError } = await supabase.from("chunks").insert({
      user_id: user.id,
      entry_id: entry.id,
      chunk_text: input.chunk_text,
      natural_version: input.natural_version ?? null,
      casual_version: input.casual_version ?? null,
      translation: input.translation ?? null,
      usage_note: input.context_note,
    });

    if (chunkError) throw chunkError;
  }

  for (const tagName of input.tags) {
    const tagId = await ensureTag(supabase, user.id, tagName);
    await supabase.from("entry_tags").insert({ entry_id: entry.id, tag_id: tagId });
  }

  const now = new Date().toISOString();

  await supabase.from("reviews").insert({
    user_id: user.id,
    entry_id: entry.id,
    review_type: "frase_propria",
    prompt: "Como voce usaria isso na sua vida?",
    expected_answer: input.original_phrase,
    due_at: now,
  });

  await incrementDailyGoal(supabase, user.id, "captured_entries");

  return entry.id;
}

export async function createPersonalSentence(input: {
  entry_id: string;
  chunk_id?: string;
  sentence: string;
  translation?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado.");

  await supabase.from("personal_sentences").insert({
    user_id: user.id,
    entry_id: input.entry_id,
    chunk_id: input.chunk_id ?? null,
    sentence: input.sentence,
    translation: input.translation ?? null,
  });

  if (input.chunk_id) {
    const { data: chunk } = await supabase
      .from("chunks")
      .select("usage_count")
      .eq("id", input.chunk_id)
      .single();

    await supabase
      .from("chunks")
      .update({ usage_count: (chunk?.usage_count ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", input.chunk_id);
  }

  await incrementDailyGoal(supabase, user.id, "personal_sentences_created");
}

export async function updateEntryStatus(entryId: string, status: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado.");

  await supabase
    .from("learning_entries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", entryId)
    .eq("user_id", user.id);
}

export async function completeReview(
  reviewId: string,
  answer: string,
  rating: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado.");

  const { data: review } = await supabase
    .from("reviews")
    .select("interval_days")
    .eq("id", reviewId)
    .maybeSingle();

  if (!review) throw new Error("Revisão não encontrada.");

  const intervalDays = nextIntervalDays(review.interval_days ?? 0, rating);
  const now = new Date();
  const dueAt = new Date(now);

  dueAt.setDate(dueAt.getDate() + intervalDays);
  dueAt.setHours(0, 0, 0, 0);

  await supabase
    .from("reviews")
    .update({
      last_answer: answer,
      rating,
      interval_days: intervalDays,
      due_at: dueAt.toISOString(),
      reviewed_at: now.toISOString(),
    })
    .eq("id", reviewId);

  await incrementDailyGoal(supabase, user.id, "reviews_completed");
}

export async function completeSpeakingPractice() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado.");

  await incrementDailyGoal(supabase, user.id, "speaking_practices");
}
