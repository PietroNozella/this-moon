"use server";

import { createClient } from "@/lib/supabase/server";
import { generateAIResponse } from "@/lib/ai/provider";

const ENRICH_PROMPT = `Voce e um analista de ingles focado em aprendizado por chunks. Retorne APENAS um JSON valido sem formatacao extra.

O texto recebido e sempre um chunk salvo pelo usuario. Analise o chunk como unidade de uso, mesmo que ele contenha apenas uma palavra ou um verbo isolado.

Extraia:

1. verbs: verbos encontrados dentro do chunk, incluindo auxiliares e modais quando existirem. Para cada verbo, informe base, tempo verbal e forma exata usada no chunk.
2. usage_contexts: 2-3 situacoes naturais, em portugues, explicando onde esse chunk e usado e com que intencao comunicativa.
3. variations: 3 variacoes uteis do chunk em ingles:
   - past: uma versao natural no passado, quando fizer sentido.
   - negative: uma versao negativa natural, quando fizer sentido.
   - question: uma versao em pergunta natural, quando fizer sentido.
4. verb_details: para CADA verbo relevante encontrado, mostre conjugacoes em presente, passado e futuro (simple, continuous e perfect) e exemplos de uso. Use sujeito "I" nas conjugacoes quando isso for natural.

Formato EXATO do JSON:
{
  "verbs": [{ "base": "try", "tense": "present perfect continuous", "form": "have been trying" }],
  "usage_contexts": ["quando voce explica uma tentativa em andamento", "para falar de algo que ainda nao conseguiu resolver"],
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

Se nao encontrar verbos, retorne verbs como array vazio e verb_details como array vazio.
Se nao conseguir determinar contexto, retorne usage_contexts como array vazio.
Se alguma variacao nao soar natural para o chunk, retorne essa chave como string vazia.
Nao invente verbos que nao estejam no chunk original.`;

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
    // enrichment falhou silenciosamente - nao bloquear o usuario
  }
}
