"use server";

import { createClient } from "@/lib/supabase/server";
import { generateAIResponse } from "@/lib/ai/provider";

const ENRICH_PROMPT = `Você é um analista de inglês focado em aprendizado por chunks. Retorne APENAS um JSON válido sem formatação extra.

O texto recebido é sempre um chunk salvo pelo usuário. Analise o chunk como unidade de uso, mesmo que ele contenha apenas uma palavra ou um verbo isolado.

Extraia:

0. translation: uma tradução natural e idiomática do chunk para o português brasileiro. Não traduza palavra por palavra — busque uma equivalência natural que um brasileiro diria na mesma situação.
1. verbs: verbos encontrados dentro do chunk, incluindo auxiliares e modais quando existirem. Para cada verbo, informe base, tempo verbal e forma exata usada no chunk.
2. usage_contexts: 2-3 situações naturais, em português, explicando onde esse chunk é usado e com que intenção comunicativa.
3. variations: 3 variações úteis do chunk em inglês:
   - past: uma versão natural no passado, quando fizer sentido.
   - negative: uma versão negativa natural, quando fizer sentido.
   - question: uma versão em pergunta natural, quando fizer sentido.
4. verb_details: para CADA verbo relevante encontrado, mostre conjugações em presente, passado e futuro (simple, continuous e perfect) e exemplos de uso. Use sujeito "I" nas conjugações quando isso for natural.

Formato EXATO do JSON:
{
  "translation": "Eu estou tentando consertar isso",
  "verbs": [{ "base": "try", "tense": "present perfect continuous", "form": "have been trying" }],
  "usage_contexts": ["quando você explica uma tentativa em andamento", "para falar de algo que ainda não conseguiu resolver"],
  "variations": {
    "past": "I had been trying to fix this",
    "negative": "I haven't been trying to fix this",
    "question": "Have I been trying to fix this?"
  },
  "verb_details": [
    {
      "base": "try",
      "tense": "present perfect continuous",
      "form": "have been trying",
      "conjugations": {
        "present": { "simple": "I try", "continuous": "I am trying", "perfect": "I have tried" },
        "past": { "simple": "I tried", "continuous": "I was trying", "perfect": "I had tried" },
        "future": { "simple": "I will try", "continuous": "I will be trying", "perfect": "I will have tried" }
      },
      "common_tenses": ["present simple", "present continuous", "present perfect"],
      "examples": [
        { "tense": "present simple", "example": "I try to exercise every morning." },
        { "tense": "present continuous", "example": "I am trying to focus on my work." },
        { "tense": "past simple", "example": "I tried calling you last night." }
      ]
    }
  ]
}

Se não encontrar verbos, retorne verbs como array vazio e verb_details como array vazio.
Se não conseguir determinar contexto, retorne usage_contexts como array vazio.
Se alguma variação não soar natural para o chunk, retorne essa chave como string vazia.
Não invente verbos que não estejam no chunk original.`;

export type VerbConjugationSet = {
  simple: string;
  continuous: string;
  perfect: string;
};

export type VerbDetail = {
  base: string;
  tense: string;
  form: string;
  conjugations: {
    present: VerbConjugationSet;
    past: VerbConjugationSet;
    future: VerbConjugationSet;
  };
  common_tenses: string[];
  examples: Array<{ tense: string; example: string }>;
};

export type EnrichmentData = {
  translation?: string;
  verbs: Array<{ base: string; tense: string; form: string }>;
  usage_contexts: string[];
  variations: {
    past: string;
    negative: string;
    question: string;
  };
  verb_details?: VerbDetail[];
};

export type EnsureEnrichmentResult =
  | "existing"
  | "created"
  | "unavailable"
  | "error";

export async function enrichEntry(entryId: string, phrase: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  try {
    const response = await generateAIResponse([
      { role: "system", content: ENRICH_PROMPT },
      { role: "user", content: `Frase: "${phrase}"` },
    ]);

    const raw = response.content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const data = JSON.parse(raw) as EnrichmentData;

    if (!data.verbs && !data.usage_contexts && !data.variations) return false;

    const { error } = await supabase.from("ai_feedbacks").insert({
      user_id: user.id,
      entry_id: entryId,
      feedback_type: "enrichment",
      input_text: phrase,
      output_json: data as unknown as Record<string, unknown>,
    });

    if (error) return false;

    return true;
  } catch {
    // enrichment falhou silenciosamente - não bloquear o usuário
    return false;
  }
}

export async function ensureEntryEnrichment(entryId: string): Promise<EnsureEnrichmentResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "unavailable";

  const { data: existing } = await supabase
    .from("ai_feedbacks")
    .select("id")
    .eq("entry_id", entryId)
    .eq("feedback_type", "enrichment")
    .limit(1)
    .maybeSingle();

  if (existing) return "existing";

  const { data: entry } = await supabase
    .from("learning_entries")
    .select("original_phrase")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .maybeSingle();

  const phrase = entry?.original_phrase?.trim();
  if (!phrase) return "unavailable";

  const created = await enrichEntry(entryId, phrase);
  return created ? "created" : "error";
}
