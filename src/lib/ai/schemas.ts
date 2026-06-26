import { z } from "zod";

export const captureAssistChunkSchema = z.object({
  translation: z.string(),
  meaningExplanation: z.string(),
  naturalPhrase: z.string(),
  pronunciationNote: z.string(),
  grammarNote: z.string(),
  difficulty: z.enum(["easy", "medium", "hard", "unknown"]),
  suggestedPersonalSentences: z.array(z.string()),
  usageExamples: z.array(z.string()),
});

export const captureAssistVerbSchema = z.object({
  translation: z.string(),
  meaningExplanation: z.string(),
  verbPatterns: z.array(z.string()),
  usageExamples: z.array(z.string()),
  commonChunks: z.array(z.string()),
  difficulty: z.enum(["easy", "medium", "hard", "unknown"]),
});

export const sentenceFeedbackSchema = z.object({
  correctedSentence: z.string(),
  naturalSentence: z.string(),
  feedbackPtBr: z.string(),
  simpleEnglishExplanation: z.string(),
  pronunciationTip: z.string(),
  examples: z.array(z.string()),
  score: z.number().min(1).max(5),
});

export const dailyCoachSchema = z.object({
  title: z.string(),
  reason: z.string(),
  nextAction: z.object({
    label: z.string(),
    href: z.string(),
  }),
  microMission: z.array(z.string()),
  suggestedEntries: z.array(z.string()),
});

export const speakingPracticeSchema = z.object({
  warmup: z.array(z.string()),
  mainPractice: z.array(z.string()),
  challenge: z.string(),
  speakWithoutLooking: z.string(),
});

export const listeningHelperSchema = z.object({
  focusWords: z.array(z.string()),
  connectedSpeechTip: z.string(),
  listenFor: z.array(z.string()),
  afterListeningQuestion: z.string(),
});

export const reviewGeneratorSchema = z.object({
  reviewTitle: z.string(),
  entries: z.array(
    z.object({
      id: z.string(),
      reason: z.string(),
      task: z.string(),
    }),
  ),
});

export const entryExplainSchema = z.object({
  translation: z.string(),
  explanation: z.string(),
  naturalVersion: z.string(),
  pronunciationTip: z.string(),
  whenToUse: z.string(),
  whenNotToUse: z.string(),
});

export const entrySentencesSchema = z.object({
  sentences: z.array(
    z.object({
      context: z.string(),
      sentence: z.string(),
    }),
  ),
});

export const entryRoleplaySchema = z.object({
  context: z.string(),
  lines: z.array(
    z.object({
      speaker: z.string(),
      text: z.string(),
    }),
  ),
});
