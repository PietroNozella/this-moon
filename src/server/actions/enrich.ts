"use server";

import { createClient } from "@/lib/supabase/server";
import { generateAIResponse } from "@/lib/ai/provider";

const ENRICH_PROMPT = `Você é um analista de inglês. Retorne APENAS um JSON válido sem formatação extra.

Analise a frase em inglês fornecida e extraia:

1. verbs: lista de verbos na frase com seus tempos verbais. Inclua verbos auxiliares.
2. usage_contexts: lista de 2-3 ocasiões ou contextos onde essa frase é usada naturalmente (em português).
3. variations: 3 variações úteis da frase original em inglês:
   - past: versão no passado
   - negative: versão negativa
   - question: versão em pergunta
4. verb_details: para CADA verbo encontrado, forneça as conjugações em presente, passado e futuro (simple, continuous e perfect) e exemplos de uso. Inclua o verbo principal como sujeito "I" nas conjugações.

Formato EXATO do JSON:
{
  "verbs": [{ "base": "try", "tense": "present perfect continuous", "form": "have been trying" }],
  "usage_contexts": ["conversas casuais", "explicar algo que estava tentando"],
  "variations": {
    "past": "I had been trying",
    "negative": "I haven't been trying",
    "question": "Have I been trying?"
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
Se não conseguir determinar contexto, retorne contexts como array vazio.
Se não conseguir variar a frase, retorne variations como objeto vazio.`;

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
  verbs: Array<{ base: string; tense: string; form: string }>;
  usage_contexts: string[];
  variations: {
    past: string;
    negative: string;
    question: string;
  };
  verb_details?: VerbDetail[];
};

export async function enrichEntry(entryId: string, phrase: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

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

    if (!data.verbs && !data.usage_contexts && !data.variations) return;

    await supabase.from("ai_feedbacks").insert({
      user_id: user.id,
      entry_id: entryId,
      feedback_type: "enrichment",
      input_text: phrase,
      output_json: data as unknown as Record<string, unknown>,
    });
  } catch {
    // enrichment falhou silenciosamente — não bloquear o usuário
  }
}
