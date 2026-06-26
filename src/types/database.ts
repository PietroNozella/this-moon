export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      learning_entries: {
        Row: EntryRow;
        Insert: EntryInsert;
        Update: EntryUpdate;
      };
      chunks: {
        Row: ChunkRow;
        Insert: ChunkInsert;
        Update: ChunkUpdate;
      };
      personal_sentences: {
        Row: PersonalSentenceRow;
        Insert: PersonalSentenceInsert;
        Update: PersonalSentenceUpdate;
      };
      tags: {
        Row: TagRow;
        Insert: TagInsert;
        Update: TagUpdate;
      };
      entry_tags: {
        Row: EntryTagRow;
        Insert: EntryTagInsert;
      };
      reviews: {
        Row: ReviewRow;
        Insert: ReviewInsert;
        Update: ReviewUpdate;
      };
      practice_sessions: {
        Row: PracticeSessionRow;
        Insert: PracticeSessionInsert;
        Update: PracticeSessionUpdate;
      };
      practice_answers: {
        Row: PracticeAnswerRow;
        Insert: PracticeAnswerInsert;
        Update: PracticeAnswerUpdate;
      };
      audio_records: {
        Row: AudioRecordRow;
        Insert: AudioRecordInsert;
        Update: AudioRecordUpdate;
      };
      ai_feedbacks: {
        Row: AiFeedbackRow;
        Insert: AiFeedbackInsert;
      };
      daily_goals: {
        Row: DailyGoalRow;
        Insert: DailyGoalInsert;
        Update: DailyGoalUpdate;
      };
      music_items: {
        Row: MusicItemRow;
        Insert: MusicItemInsert;
        Update: MusicItemUpdate;
      };
      roleplay_scenarios: {
        Row: RoleplayScenarioRow;
        Insert: RoleplayScenarioInsert;
        Update: RoleplayScenarioUpdate;
      };
      ai_interactions: {
        Row: AiInteractionRow;
        Insert: AiInteractionInsert;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

/* ── Profiles ── */

export type ProfileRow = {
  id: string;
  name: string | null;
  native_language: string | null;
  target_language: string | null;
  current_level: string | null;
  main_goal: string | null;
  daily_minutes_goal: number | null;
  interests: string[] | null;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = {
  id: string;
  name?: string | null;
  native_language?: string | null;
  target_language?: string | null;
  current_level?: string | null;
  main_goal?: string | null;
  daily_minutes_goal?: number | null;
  interests?: string[] | null;
  created_at?: string;
  updated_at?: string;
};

export type ProfileUpdate = Partial<ProfileInsert>;

/* ── Learning entries ── */

export type EntryRow = {
  id: string;
  user_id: string;
  original_phrase: string;
  translation: string | null;
  meaning_explanation: string | null;
  source_type: string;
  source_title: string | null;
  source_url: string | null;
  context_note: string | null;
  difficulty: string | null;
  status: string | null;
  favorite: boolean | null;
  entry_type: string;
  natural_phrase: string | null;
  pronunciation_note: string | null;
  grammar_note: string | null;
  source_timestamp: string | null;
  confidence_level: number | null;
  last_practiced_at: string | null;
  times_practiced: number | null;
  verb_patterns: Json | null;
  created_at: string;
  updated_at: string;
};

export type EntryInsert = {
  id?: string;
  user_id: string;
  original_phrase: string;
  translation?: string | null;
  meaning_explanation?: string | null;
  source_type: string;
  source_title?: string | null;
  source_url?: string | null;
  context_note?: string | null;
  difficulty?: string | null;
  status?: string | null;
  favorite?: boolean | null;
  entry_type?: string;
  natural_phrase?: string | null;
  pronunciation_note?: string | null;
  grammar_note?: string | null;
  source_timestamp?: string | null;
  confidence_level?: number | null;
  last_practiced_at?: string | null;
  times_practiced?: number | null;
  verb_patterns?: Json | null;
  created_at?: string;
  updated_at?: string;
};

export type EntryUpdate = Partial<EntryInsert>;

/* ── Chunks ── */

export type ChunkRow = {
  id: string;
  user_id: string;
  entry_id: string | null;
  chunk_text: string;
  natural_version: string | null;
  casual_version: string | null;
  translation: string | null;
  usage_note: string | null;
  pronunciation_note: string | null;
  status: string | null;
  usage_count: number | null;
  created_at: string;
  updated_at: string;
};

export type ChunkInsert = {
  id?: string;
  user_id: string;
  entry_id?: string | null;
  chunk_text: string;
  natural_version?: string | null;
  casual_version?: string | null;
  translation?: string | null;
  usage_note?: string | null;
  pronunciation_note?: string | null;
  status?: string | null;
  usage_count?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type ChunkUpdate = Partial<ChunkInsert>;

/* ── Personal sentences ── */

export type PersonalSentenceRow = {
  id: string;
  user_id: string;
  entry_id: string | null;
  chunk_id: string | null;
  sentence: string;
  corrected_sentence: string | null;
  natural_sentence: string | null;
  translation: string | null;
  ai_feedback: string | null;
  status: string | null;
  favorite: boolean | null;
  created_at: string;
  updated_at: string;
};

export type PersonalSentenceInsert = {
  id?: string;
  user_id: string;
  entry_id?: string | null;
  chunk_id?: string | null;
  sentence: string;
  corrected_sentence?: string | null;
  natural_sentence?: string | null;
  translation?: string | null;
  ai_feedback?: string | null;
  status?: string | null;
  favorite?: boolean | null;
  created_at?: string;
  updated_at?: string;
};

export type PersonalSentenceUpdate = Partial<PersonalSentenceInsert>;

/* ── Tags ── */

export type TagRow = {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
};

export type TagInsert = {
  id?: string;
  user_id: string;
  name: string;
  color?: string | null;
  created_at?: string;
};

export type TagUpdate = Partial<TagInsert>;

/* ── Entry tags ── */

export type EntryTagRow = {
  entry_id: string;
  tag_id: string;
};

export type EntryTagInsert = {
  entry_id: string;
  tag_id: string;
};

/* ── Reviews ── */

export type ReviewRow = {
  id: string;
  user_id: string;
  entry_id: string | null;
  chunk_id: string | null;
  review_type: string;
  prompt: string | null;
  expected_answer: string | null;
  last_answer: string | null;
  rating: string | null;
  ease_factor: number | null;
  interval_days: number | null;
  due_at: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type ReviewInsert = {
  id?: string;
  user_id: string;
  entry_id?: string | null;
  chunk_id?: string | null;
  review_type: string;
  prompt?: string | null;
  expected_answer?: string | null;
  last_answer?: string | null;
  rating?: string | null;
  ease_factor?: number | null;
  interval_days?: number | null;
  due_at?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
};

export type ReviewUpdate = Partial<ReviewInsert>;

/* ── Practice sessions ── */

export type PracticeSessionRow = {
  id: string;
  user_id: string;
  mode: string;
  source_type: string | null;
  duration_seconds: number | null;
  entries_practiced: number | null;
  entry_id: string | null;
  notes: string | null;
  created_at: string;
};

export type PracticeSessionInsert = {
  id?: string;
  user_id: string;
  mode: string;
  source_type?: string | null;
  duration_seconds?: number | null;
  entries_practiced?: number | null;
  notes?: string | null;
  created_at?: string;
};

export type PracticeSessionUpdate = Partial<PracticeSessionInsert>;

/* ── Practice answers ── */

export type PracticeAnswerRow = {
  id: string;
  user_id: string;
  session_id: string | null;
  entry_id: string | null;
  chunk_id: string | null;
  prompt: string | null;
  answer: string | null;
  corrected_answer: string | null;
  feedback: string | null;
  rating: string | null;
  created_at: string;
};

export type PracticeAnswerInsert = {
  id?: string;
  user_id: string;
  session_id?: string | null;
  entry_id?: string | null;
  chunk_id?: string | null;
  prompt?: string | null;
  answer?: string | null;
  corrected_answer?: string | null;
  feedback?: string | null;
  rating?: string | null;
  created_at?: string;
};

export type PracticeAnswerUpdate = Partial<PracticeAnswerInsert>;

/* ── Audio records ── */

export type AudioRecordRow = {
  id: string;
  user_id: string;
  entry_id: string | null;
  chunk_id: string | null;
  sentence_id: string | null;
  storage_path: string;
  transcript: string | null;
  self_rating: string | null;
  ai_feedback: string | null;
  created_at: string;
};

export type AudioRecordInsert = {
  id?: string;
  user_id: string;
  entry_id?: string | null;
  chunk_id?: string | null;
  sentence_id?: string | null;
  storage_path: string;
  transcript?: string | null;
  self_rating?: string | null;
  ai_feedback?: string | null;
  created_at?: string;
};

export type AudioRecordUpdate = Partial<AudioRecordInsert>;

/* ── AI feedbacks ── */

export type AiFeedbackRow = {
  id: string;
  user_id: string;
  entry_id: string | null;
  sentence_id: string | null;
  feedback_type: string;
  input_text: string;
  output_json: Json | null;
  created_at: string;
};

export type AiFeedbackInsert = {
  id?: string;
  user_id: string;
  entry_id?: string | null;
  sentence_id?: string | null;
  feedback_type: string;
  input_text: string;
  output_json?: Json | null;
  created_at?: string;
};

/* ── Daily goals ── */

export type DailyGoalRow = {
  id: string;
  user_id: string;
  goal_date: string;
  captured_entries: number | null;
  captured_verbs: number | null;
  reviews_completed: number | null;
  personal_sentences_created: number | null;
  speaking_practices: number | null;
  listening_practices: number | null;
  shadowing_practices: number | null;
  practiced_entries: number | null;
  listening_minutes: number | null;
  completed: boolean | null;
  created_at: string;
};

export type DailyGoalInsert = {
  id?: string;
  user_id: string;
  goal_date: string;
  captured_entries?: number | null;
  captured_verbs?: number | null;
  reviews_completed?: number | null;
  personal_sentences_created?: number | null;
  speaking_practices?: number | null;
  listening_practices?: number | null;
  shadowing_practices?: number | null;
  practiced_entries?: number | null;
  listening_minutes?: number | null;
  completed?: boolean | null;
  created_at?: string;
};

export type DailyGoalUpdate = Partial<DailyGoalInsert>;

/* ── Music items ── */

export type MusicItemRow = {
  id: string;
  user_id: string;
  title: string;
  artist: string | null;
  genre: string | null;
  source_url: string | null;
  studied_excerpt: string | null;
  excerpt_translation: string | null;
  context_note: string | null;
  created_at: string;
  updated_at: string;
};

export type MusicItemInsert = {
  id?: string;
  user_id: string;
  title: string;
  artist?: string | null;
  genre?: string | null;
  source_url?: string | null;
  studied_excerpt?: string | null;
  excerpt_translation?: string | null;
  context_note?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type MusicItemUpdate = Partial<MusicItemInsert>;

/* ── Roleplay scenarios ── */

export type RoleplayScenarioRow = {
  id: string;
  user_id: string | null;
  title: string;
  category: string;
  description: string | null;
  difficulty: string | null;
  is_system: boolean | null;
  created_at: string;
};

export type RoleplayScenarioInsert = {
  id?: string;
  user_id?: string | null;
  title: string;
  category: string;
  description?: string | null;
  difficulty?: string | null;
  is_system?: boolean | null;
  created_at?: string;
};

export type RoleplayScenarioUpdate = Partial<RoleplayScenarioInsert>;

/* ── AI Interactions ── */

export type AiInteractionRow = {
  id: string;
  user_id: string;
  feature: string;
  input: Json;
  output: Json;
  related_entry_id: string | null;
  created_at: string;
};

export type AiInteractionInsert = {
  id?: string;
  user_id: string;
  feature: string;
  input?: Json;
  output?: Json;
  related_entry_id?: string | null;
  created_at?: string;
};
