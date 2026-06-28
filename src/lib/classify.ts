export type EntryType =
  | "chunk"
  | "phrasal_verb"
  | "pattern"
  | "word"
  | "expression"
  | "base_verb";

const phrasalVerbs = new Set([
  "look for", "look at", "look up", "look after", "look forward to",
  "pick up", "pick out",
  "get up", "get back", "get in", "get out", "get off", "get on", "get over", "get through",
  "come on", "come in", "come back", "come up", "come out",
  "go on", "go out", "go back", "go away", "go up", "go down",
  "put on", "put off", "put away", "put up", "put down",
  "take off", "take on", "take in", "take out", "take over", "take up",
  "turn on", "turn off", "turn up", "turn down", "turn around",
  "set up", "set off", "set out",
  "bring up", "bring in", "bring out", "bring back",
  "call off", "call back", "call out",
  "find out", "figure out", "work out", "point out", "check out",
  "show up", "show off",
  "break down", "break up", "break out", "break into",
  "cut off", "cut out", "cut back",
  "give up", "give in", "give back", "give out",
  "hold on", "hold up", "hold back",
  "keep on", "keep up", "keep away",
  "run out", "run into", "run away",
  "try on", "try out",
  "wait for", "wait on",
  "ask for", "ask out",
  "care for", "care about",
  "pay for", "pay off", "pay back",
  "talk to", "talk about", "talk back",
  "think about", "think of", "think over",
  "deal with", "depend on", "rely on",
  "believe in", "belong to",
  "laugh at", "look like", "sound like",
  "end up", "start over", "move on", "move out", "move in",
]);

const patterns = new Set([
  "i gotta", "i wanna", "i'm gonna", "i'm trying to", "i need to",
  "i have to", "i got to", "i used to", "i'm going to",
  "i'd like to", "i'd rather", "i'd better",
  "i can't", "i don't", "i didn't", "i won't", "i wouldn't",
  "you gotta", "you wanna", "you're gonna",
  "what would you", "what do you", "what are you", "what is",
  "how do you", "how are you", "how is",
  "there is", "there are", "there was", "there were",
  "it is", "it was", "it's",
  "that is", "that was", "that's",
  "let me", "let's", "lemme",
]);

const commonVerbs = new Set([
  "get", "take", "make", "do", "have", "go", "say", "be", "can", "will",
  "would", "could", "should", "may", "might", "must",
  "see", "know", "think", "want", "give", "tell", "come", "look",
  "use", "find", "need", "feel", "try", "leave", "call", "keep",
  "let", "begin", "show", "hear", "play", "run", "move", "live",
  "believe", "bring", "happen", "write", "provide", "sit", "stand",
  "lose", "pay", "meet", "include", "continue", "set", "learn",
  "change", "lead", "understand", "watch", "follow", "stop",
  "create", "speak", "read", "allow", "add", "spend", "grow",
  "open", "walk", "win", "teach", "offer", "remember", "love",
  "consider", "appear", "buy", "wait", "serve", "die", "send",
  "expect", "build", "stay", "fall", "cut", "reach", "kill",
  "remain", "suggest", "raise", "pass", "sell", "require",
  "report", "decide", "pull", "put", "pick",
]);

const expressions = new Set([
  "by the way", "by the time", "as well", "as soon as", "as long as",
  "in case", "in order to", "in the end", "in a nutshell",
  "at first", "at least", "at all", "at the end of the day",
  "on the other hand", "on purpose", "on time",
  "all of a sudden", "all the time", "all in all",
  "more or less", "sooner or later", "back and forth",
  "step by step", "bit by bit", "day by day",
  "no matter what", "no way", "no wonder",
  "what if", "what about", "how about",
  "kind of", "sort of", "a lot of", "a bit of", "a couple of",
  "in fact", "in general", "in particular", "in common",
  "for example", "for instance", "for sure", "for real",
  "of course", "after all", "above all", "first of all",
  "as usual", "as always", "as well as",
  "so far", "so what", "so that",
  "even though", "even if", "even so",
  "just in case", "just like", "just about",
]);

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/[.!?,;:]$/, "").replace(/\s+/g, " ");
}

export function classify(text: string): EntryType {
  const normalized = normalize(text);
  const words = normalized.split(/\s+/);
  const wordCount = words.length;

  if (wordCount >= 3) {
    if (expressions.has(normalized)) return "expression";
    if (normalized.endsWith(" to") && (normalized.startsWith("i ") || normalized.startsWith("you "))) return "pattern";
    return "chunk";
  }

  if (wordCount === 2 || wordCount === 3) {
    if (phrasalVerbs.has(normalized)) return "phrasal_verb";
    if (expressions.has(normalized)) return "expression";
    if (patterns.has(normalized)) return "pattern";
    if (normallyChunk(normalized)) return "chunk";
    return "chunk";
  }

  if (wordCount === 1) {
    if (commonVerbs.has(normalized)) return "base_verb";
    return "word";
  }

  return "chunk";
}

function normallyChunk(text: string): boolean {
  const words = text.split(/\s+/);
  return words.length >= 2 && /^[a-z]/.test(words[0]);
}
