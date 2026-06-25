"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  clearLocalState,
  createEmptyLocalState,
  parseImportedState,
  readLocalState,
  writeLocalState,
} from "@/lib/local-db";
import { todayISO } from "@/lib/utils";
import type {
  CreateEntryInput,
  CreatePersonalSentenceInput,
  LocalDailyGoal,
  LocalReview,
  LocalState,
} from "@/types/local";

type LocalStoreContextValue = {
  state: LocalState;
  isLoaded: boolean;
  createEntry: (input: CreateEntryInput) => string;
  createPersonalSentence: (input: CreatePersonalSentenceInput) => void;
  updateEntryStatus: (entryId: string, status: string) => void;
  completeReview: (reviewId: string, answer: string, rating: string) => void;
  completeSpeakingPractice: () => void;
  exportData: () => string;
  importData: (payload: string) => void;
  resetData: () => Promise<void>;
};

const LocalStoreContext = createContext<LocalStoreContextValue | null>(null);

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nextIntervalDays(current: number, rating: string) {
  const intervals = [0, 1, 3, 7, 15, 30];

  if (rating === "forgot") {
    return 0;
  }

  if (rating === "hard") {
    return Math.max(1, Math.min(current, 1));
  }

  const currentIndex = intervals.findIndex((item) => item >= current);

  if (rating === "easy") {
    return intervals[Math.min(currentIndex + 2, intervals.length - 1)] ?? 30;
  }

  return intervals[Math.min(currentIndex + 1, intervals.length - 1)] ?? 30;
}

function createDailyGoal(date: string): LocalDailyGoal {
  return {
    goal_date: date,
    captured_entries: 0,
    reviews_completed: 0,
    personal_sentences_created: 0,
    speaking_practices: 0,
    listening_minutes: 0,
    completed: false,
    created_at: new Date().toISOString(),
  };
}

function incrementDailyGoal(
  state: LocalState,
  field:
    | "captured_entries"
    | "reviews_completed"
    | "personal_sentences_created"
    | "speaking_practices"
    | "listening_minutes",
) {
  const date = todayISO();
  const current: LocalDailyGoal = state.dailyGoals[date] ?? createDailyGoal(date);

  return {
    ...state.dailyGoals,
    [date]: {
      ...current,
      [field]: current[field] + 1,
    },
  };
}

export function LocalStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<LocalState>(() => createEmptyLocalState());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let shouldApplyLoadedState = true;

    const fallbackTimer = window.setTimeout(() => {
      if (isMounted) {
        shouldApplyLoadedState = false;
        setIsLoaded(true);
      }
    }, 1200);

    readLocalState()
      .then((loadedState) => {
        if (isMounted && shouldApplyLoadedState) {
          window.clearTimeout(fallbackTimer);
          setState(loadedState);
          setIsLoaded(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          window.clearTimeout(fallbackTimer);
          setIsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  const persist = useCallback((updater: (state: LocalState) => LocalState) => {
    setState((current) => {
      const next = { ...updater(current), updatedAt: new Date().toISOString() };
      void writeLocalState(next);
      return next;
    });
  }, []);

  const createEntry = useCallback(
    (input: CreateEntryInput) => {
      const now = new Date().toISOString();
      const entryId = createId();
      const chunkId = input.chunk_text ? createId() : undefined;

      persist((current) => {
        const reviews: LocalReview[] = [
          ...current.reviews,
          {
            id: createId(),
            entry_id: entryId,
            chunk_id: chunkId,
            review_type: "frase_propria",
            prompt: "Como voce usaria isso na sua vida?",
            expected_answer: input.original_phrase,
            ease_factor: 2.5,
            interval_days: 0,
            due_at: now,
            created_at: now,
          },
        ];

        return {
          ...current,
          entries: [
            ...current.entries,
            {
              id: entryId,
              original_phrase: input.original_phrase,
              translation: input.translation,
              meaning_explanation: input.meaning_explanation,
              source_type: input.source_type,
              source_title: input.source_title,
              source_url: input.source_url,
              context_note: input.context_note,
              difficulty: input.difficulty,
              status: "new",
              favorite: false,
              tags: input.tags,
              created_at: now,
              updated_at: now,
            },
          ],
          chunks: input.chunk_text
            ? [
                ...current.chunks,
                {
                  id: chunkId!,
                  entry_id: entryId,
                  chunk_text: input.chunk_text,
                  natural_version: input.natural_version,
                  casual_version: input.casual_version,
                  translation: input.translation,
                  usage_note: input.context_note,
                  status: "new",
                  usage_count: 0,
                  created_at: now,
                  updated_at: now,
                },
              ]
            : current.chunks,
          reviews,
          dailyGoals: incrementDailyGoal(current, "captured_entries"),
        };
      });

      return entryId;
    },
    [persist],
  );

  const createPersonalSentence = useCallback(
    (input: CreatePersonalSentenceInput) => {
      const now = new Date().toISOString();

      persist((current) => ({
        ...current,
        personalSentences: [
          ...current.personalSentences,
          {
            id: createId(),
            entry_id: input.entry_id,
            chunk_id: input.chunk_id,
            sentence: input.sentence,
            translation: input.translation,
            status: "created",
            favorite: false,
            created_at: now,
            updated_at: now,
          },
        ],
        chunks: current.chunks.map((chunk) =>
          chunk.id === input.chunk_id
            ? { ...chunk, usage_count: chunk.usage_count + 1, updated_at: now }
            : chunk,
        ),
        dailyGoals: incrementDailyGoal(current, "personal_sentences_created"),
      }));
    },
    [persist],
  );

  const updateEntryStatus = useCallback(
    (entryId: string, status: string) => {
      persist((current) => ({
        ...current,
        entries: current.entries.map((entry) =>
          entry.id === entryId
            ? { ...entry, status, updated_at: new Date().toISOString() }
            : entry,
        ),
      }));
    },
    [persist],
  );

  const completeReview = useCallback(
    (reviewId: string, answer: string, rating: string) => {
      const now = new Date();

      persist((current) => ({
        ...current,
        reviews: current.reviews.map((review) => {
          if (review.id !== reviewId) {
            return review;
          }

          const intervalDays = nextIntervalDays(review.interval_days, rating);
          const dueAt = new Date(now);
          dueAt.setDate(dueAt.getDate() + intervalDays);

          return {
            ...review,
            last_answer: answer,
            rating,
            interval_days: intervalDays,
            due_at: dueAt.toISOString(),
            reviewed_at: now.toISOString(),
          };
        }),
        dailyGoals: incrementDailyGoal(current, "reviews_completed"),
      }));
    },
    [persist],
  );

  const completeSpeakingPractice = useCallback(() => {
    persist((current) => {
      const date = todayISO();
      const dailyGoal = current.dailyGoals[date] ?? createDailyGoal(date);

      if (dailyGoal.speaking_practices > 0) {
        return current;
      }

      return {
        ...current,
        dailyGoals: {
          ...current.dailyGoals,
          [date]: {
            ...dailyGoal,
            speaking_practices: 1,
          },
        },
      };
    });
  }, [persist]);

  const exportData = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const importData = useCallback(
    (payload: string) => {
      const imported = parseImportedState(payload);
      persist(() => imported);
    },
    [persist],
  );

  const resetData = useCallback(async () => {
    const empty = createEmptyLocalState();
    await clearLocalState();
    setState(empty);
  }, []);

  const value = useMemo<LocalStoreContextValue>(
    () => ({
      state,
      isLoaded,
      createEntry,
      createPersonalSentence,
      updateEntryStatus,
      completeReview,
      completeSpeakingPractice,
      exportData,
      importData,
      resetData,
    }),
    [
      state,
      isLoaded,
      createEntry,
      createPersonalSentence,
      updateEntryStatus,
      completeReview,
      completeSpeakingPractice,
      exportData,
      importData,
      resetData,
    ],
  );

  return (
    <LocalStoreContext.Provider value={value}>
      {children}
    </LocalStoreContext.Provider>
  );
}

export function useLocalStore() {
  const context = useContext(LocalStoreContext);

  if (!context) {
    throw new Error("useLocalStore precisa estar dentro de LocalStoreProvider.");
  }

  return context;
}


