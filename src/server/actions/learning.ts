"use server";

import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils";

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

type DailyGoalField =
  | "captured_entries"
  | "captured_verbs"
  | "reviews_completed"
  | "personal_sentences_created"
  | "speaking_practices"
  | "listening_practices"
  | "shadowing_practices"
  | "practiced_entries";

async function incrementDailyGoal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  field: DailyGoalField,
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
  natural_phrase?: string;
  pronunciation_note?: string;
  grammar_note?: string;
  source_timestamp?: string;
  confidence_level?: number;
  verb_patterns?: string[];
  tags: string[];
  entry_type: string;
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
      entry_type: input.entry_type,
      natural_phrase: input.natural_phrase ?? null,
      pronunciation_note: input.pronunciation_note ?? null,
      grammar_note: input.grammar_note ?? null,
      source_timestamp: input.source_timestamp ?? null,
      confidence_level: input.confidence_level ?? null,
      verb_patterns: input.verb_patterns ?? null,
    })
    .select("id")
    .maybeSingle();

  if (entryError || !entry) throw entryError ?? new Error("Falha ao criar entrada.");

  if (input.entry_type === "chunk" && input.chunk_text) {
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

  if (input.entry_type === "chunk") {
    for (const tagName of input.tags) {
      const tagId = await ensureTag(supabase, user.id, tagName);
      await supabase.from("entry_tags").insert({ entry_id: entry.id, tag_id: tagId });
    }
  }

  await incrementDailyGoal(
    supabase,
    user.id,
    input.entry_type === "verb" ? "captured_verbs" : "captured_entries",
  );

  return entry.id;
}

export async function quickCapture(input: {
  text: string;
  context?: string;
  source?: string;
  note?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado.");

  const { classify } = await import("@/lib/classify");
  const entryType = classify(input.text);

  const entryId = await createEntry({
    original_phrase: input.text,
    source_type: input.source ?? "other",
    context_note: input.context ?? "Quero usar essa frase no meu dia a dia.",
    difficulty: "unknown",
    entry_type: entryType === "chunk" ? "chunk" : "verb",
    tags: [],
    grammar_note: input.note ?? undefined,
  });

  // enriquecimento silencioso com IA em background
  const { enrichEntry } = await import("@/server/actions/enrich");
  enrichEntry(entryId, input.text).catch(() => {});

  return entryId;
}

export async function createVerb(input: {
  verb: string;
  meaning: string;
  context: string;
  verb_patterns?: string[];
  difficulty?: string;
  usageContexts?: string[];
}) {
  return createEntry({
    original_phrase: input.verb,
    translation: input.meaning,
    meaning_explanation: input.context,
    source_type: "other",
    context_note: input.context,
    difficulty: input.difficulty ?? "unknown",
    entry_type: "verb",
    tags: [],
    verb_patterns: input.verb_patterns,
  });
}

export async function completeVerbPatternPractice(input: {
  entryId: string;
  sentences: string[];
  confidenceLevel?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado.");

  const { data: entry } = await supabase
    .from("learning_entries")
    .select("entry_type, original_phrase")
    .eq("id", input.entryId)
    .single();

  if (!entry) throw new Error("Entrada não encontrada.");
  if (entry.entry_type !== "verb") throw new Error("Esta entrada não é um verbo.");

  for (const sentence of input.sentences) {
    await supabase.from("personal_sentences").insert({
      user_id: user.id,
      entry_id: input.entryId,
      sentence,
    });
  }

  await createPracticeSession({
    entry_id: input.entryId,
    practice_type: "review",
    self_rating: input.confidenceLevel,
    note: `Treino de verbo/padrões com "${entry.original_phrase}"`,
  });

  await incrementDailyGoal(supabase, user.id, "personal_sentences_created");
}

export async function createPracticeSession(input: {
  entry_id: string;
  practice_type: "listening" | "speaking" | "shadowing" | "review";
  self_rating?: number;
  note?: string;
  duration_seconds?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado.");

  const { data: session } = await supabase
    .from("practice_sessions")
    .insert({
      user_id: user.id,
      mode: input.practice_type,
      duration_seconds: input.duration_seconds ?? 0,
      entry_id: input.entry_id,
      notes: input.note ?? null,
    })
    .select("id")
    .maybeSingle();

  if (!session) throw new Error("Falha ao criar sessão.");

  const { data: entry } = await supabase
    .from("learning_entries")
    .select("times_practiced")
    .eq("id", input.entry_id)
    .single();

  await supabase
    .from("learning_entries")
    .update({
      last_practiced_at: new Date().toISOString(),
      times_practiced: (entry?.times_practiced ?? 0) + 1,
      confidence_level: input.self_rating ?? undefined,
    })
    .eq("id", input.entry_id);

  return session.id;
}

export async function completeListeningPractice(input: {
  entryId: string;
  confidenceLevel?: number;
  listeningRepetitions?: number;
  notes?: string;
  personalSentence?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado.");

  const noteParts: string[] = [];
  if (input.notes) noteParts.push(`Experiência ouvindo: ${input.notes}`);
  if (input.listeningRepetitions) noteParts.push(`Repetições: ${input.listeningRepetitions}`);

  await createPracticeSession({
    entry_id: input.entryId,
    practice_type: "listening",
    self_rating: input.confidenceLevel,
    note: noteParts.length > 0 ? noteParts.join("\n") : undefined,
  });

  if (input.personalSentence) {
    await supabase.from("personal_sentences").insert({
      user_id: user.id,
      entry_id: input.entryId,
      sentence: input.personalSentence,
    });
    await incrementDailyGoal(supabase, user.id, "personal_sentences_created");
  }

  await incrementDailyGoal(supabase, user.id, "listening_practices");
}

export async function completeShadowingPractice(entryId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado.");

  await createPracticeSession({ entry_id: entryId, practice_type: "shadowing" });
  await incrementDailyGoal(supabase, user.id, "shadowing_practices");
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

export async function completePractice(input: {
  entryId: string;
  confidenceLevel?: number;
  listeningNotes?: string;
  listeningRepetitions?: number;
  personalSentence?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado.");

  const noteParts: string[] = [];
  if (input.listeningNotes) noteParts.push(`Experiência ouvindo: ${input.listeningNotes}`);
  if (input.listeningRepetitions) noteParts.push(`Repetições: ${input.listeningRepetitions}`);

  await createPracticeSession({
    entry_id: input.entryId,
    practice_type: "speaking",
    self_rating: input.confidenceLevel,
    note: noteParts.length > 0 ? noteParts.join("\n") : undefined,
  });

  if (input.personalSentence) {
    await supabase.from("personal_sentences").insert({
      user_id: user.id,
      entry_id: input.entryId,
      sentence: input.personalSentence,
    });
    await incrementDailyGoal(supabase, user.id, "personal_sentences_created");
  }

  await incrementDailyGoal(supabase, user.id, "speaking_practices");
  await incrementDailyGoal(supabase, user.id, "listening_practices");
}

export async function completeSpeakingPractice(entryId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado.");

  if (entryId) {
    await createPracticeSession({ entry_id: entryId, practice_type: "speaking" });
  }

  await incrementDailyGoal(supabase, user.id, "speaking_practices");
}

export async function deleteEntry(entryId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado.");

  const { error } = await supabase
    .from("learning_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (error) throw new Error("Falha ao excluir entrada.");
}

export async function completeDailyTraining(input: {
  narrationText?: string;
  connectorSentence?: string;
  connectorEntryId?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado.");

  if (input.connectorSentence && input.connectorEntryId) {
    await supabase.from("personal_sentences").insert({
      user_id: user.id,
      entry_id: input.connectorEntryId,
      sentence: input.connectorSentence,
    });
    await incrementDailyGoal(supabase, user.id, "personal_sentences_created");
  }

  await supabase.from("practice_sessions").insert({
    user_id: user.id,
    mode: "review",
    duration_seconds: 0,
    notes: input.narrationText ?? null,
  });

  await incrementDailyGoal(supabase, user.id, "practiced_entries");
}
