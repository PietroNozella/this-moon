export type LocalEntry = {
  id: string;
  original_phrase: string;
  translation?: string;
  meaning_explanation?: string;
  source_type: string;
  source_title?: string;
  source_url?: string;
  context_note: string;
  difficulty: string;
  status: string;
  favorite: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type LocalChunk = {
  id: string;
  entry_id: string;
  chunk_text: string;
  natural_version?: string;
  casual_version?: string;
  translation?: string;
  usage_note?: string;
  pronunciation_note?: string;
  status: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
};

export type LocalPersonalSentence = {
  id: string;
  entry_id: string;
  chunk_id?: string;
  sentence: string;
  corrected_sentence?: string;
  natural_sentence?: string;
  translation?: string;
  ai_feedback?: string;
  status: string;
  favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type LocalReview = {
  id: string;
  entry_id: string;
  chunk_id?: string;
  review_type: string;
  prompt: string;
  expected_answer?: string;
  last_answer?: string;
  rating?: string;
  ease_factor: number;
  interval_days: number;
  due_at: string;
  reviewed_at?: string;
  created_at: string;
};

export type LocalDailyGoal = {
  goal_date: string;
  captured_entries: number;
  reviews_completed: number;
  personal_sentences_created: number;
  speaking_practices: number;
  listening_minutes: number;
  completed: boolean;
  created_at: string;
};

export type LocalState = {
  version: 1;
  entries: LocalEntry[];
  chunks: LocalChunk[];
  personalSentences: LocalPersonalSentence[];
  reviews: LocalReview[];
  dailyGoals: Record<string, LocalDailyGoal>;
  updatedAt: string;
};

export type CreateEntryInput = {
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
};

export type CreatePersonalSentenceInput = {
  entry_id: string;
  chunk_id?: string;
  sentence: string;
  translation?: string;
};

export type LocalDueReview = LocalReview & {
  entry?: LocalEntry;
  chunk?: LocalChunk;
};
