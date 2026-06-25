import { todayISO } from "@/lib/utils";
import type {
  LocalChunk,
  LocalDailyGoal,
  LocalDueReview,
  LocalEntry,
  LocalState,
} from "@/types/local";

export type LibraryFilters = {
  q?: string;
  status?: string;
  source?: string;
  difficulty?: string;
};

export type EntryDetail = LocalEntry & {
  chunks: LocalChunk[];
  personal_sentences: LocalState["personalSentences"];
  reviews: LocalState["reviews"];
};

export function getTodayGoal(state: LocalState): LocalDailyGoal {
  const date = todayISO();

  return (
    state.dailyGoals[date] ?? {
      goal_date: date,
      captured_entries: 0,
      reviews_completed: 0,
      personal_sentences_created: 0,
      speaking_practices: 0,
      listening_minutes: 0,
      completed: false,
      created_at: new Date().toISOString(),
    }
  );
}

export function getDueReviews(state: LocalState) {
  const now = Date.now();

  return state.reviews
    .filter((review) => new Date(review.due_at).getTime() <= now)
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
    .map<LocalDueReview>((review) => ({
      ...review,
      entry: state.entries.find((entry) => entry.id === review.entry_id),
      chunk: state.chunks.find((chunk) => chunk.id === review.chunk_id),
    }));
}

export function getDashboardData(state: LocalState) {
  const dueReviews = getDueReviews(state);
  const dailyGoal = getTodayGoal(state);
  const sortedChunks = [...state.chunks].sort(
    (a, b) => b.usage_count - a.usage_count,
  );

  return {
    entriesCount: state.entries.length,
    personalSentencesCount: state.personalSentences.length,
    pendingReviewsCount: dueReviews.length,
    completedReviewsCount: state.reviews.filter((review) => review.reviewed_at)
      .length,
    practiceSessionsCount: 0,
    masteredChunksCount: state.chunks.filter(
      (chunk) => chunk.status === "mastered",
    ).length,
    activeChunksCount: state.chunks.filter((chunk) =>
      ["new", "learning", "practicing", "almost_natural"].includes(
        chunk.status,
      ),
    ).length,
    dailyGoal,
    chunkOfDay: sortedChunks[0] ?? null,
    recentEntries: [...state.entries]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 5),
    dueReviews: dueReviews.slice(0, 4),
  };
}

export function getLibraryEntries(
  state: LocalState,
  filters: LibraryFilters = {},
) {
  const search = filters.q?.trim().toLowerCase();

  return [...state.entries]
    .filter((entry) => {
      if (filters.status && entry.status !== filters.status) {
        return false;
      }

      if (filters.source && entry.source_type !== filters.source) {
        return false;
      }

      if (filters.difficulty && entry.difficulty !== filters.difficulty) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        entry.original_phrase,
        entry.translation,
        entry.context_note,
        entry.tags.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search);
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .map((entry) => ({
      ...entry,
      chunks: state.chunks.filter((chunk) => chunk.entry_id === entry.id),
    }));
}

export function getEntryDetail(state: LocalState, entryId: string) {
  const entry = state.entries.find((item) => item.id === entryId);

  if (!entry) {
    return null;
  }

  return {
    ...entry,
    chunks: state.chunks.filter((chunk) => chunk.entry_id === entry.id),
    personal_sentences: state.personalSentences.filter(
      (sentence) => sentence.entry_id === entry.id,
    ),
    reviews: state.reviews.filter((review) => review.entry_id === entry.id),
  } satisfies EntryDetail;
}

export function getChunksBySource(state: LocalState, sourceType?: string) {
  const allowedEntryIds = new Set(
    state.entries
      .filter((entry) => !sourceType || entry.source_type === sourceType)
      .map((entry) => entry.id),
  );

  return state.chunks
    .filter((chunk) => allowedEntryIds.has(chunk.entry_id))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 12);
}
