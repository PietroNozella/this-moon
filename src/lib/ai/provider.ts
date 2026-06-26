import OpenAI from "openai";

const client = new OpenAI({
  baseURL: process.env.AI_BASE_URL ?? "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.AI_API_KEY ?? "",
});

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIProviderResponse = {
  content: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

export async function generateAIResponse(
  messages: AIMessage[],
): Promise<AIProviderResponse> {
  const model = process.env.AI_MODEL ?? "mistralai/mixtral-8x22b-instruct-v0.1";

  const completion = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.4,
    max_tokens: 2048,
  });

  return {
    content: completion.choices[0]?.message?.content ?? "",
    usage: {
      inputTokens: completion.usage?.prompt_tokens,
      outputTokens: completion.usage?.completion_tokens,
    },
  };
}
