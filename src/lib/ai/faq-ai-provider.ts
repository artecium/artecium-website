import type { FaqAiResponseBody } from "@/lib/ai/types";

export type FaqAiProvider = "gemini" | "openai";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export function resolveFaqAiProvider(): FaqAiProvider {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();
  return provider === "openai" ? "openai" : "gemini";
}

export function isFaqAiProviderConfigured(provider: FaqAiProvider): boolean {
  if (provider === "openai") {
    return Boolean(process.env.AI_API_KEY?.trim());
  }
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function getFaqAiDefaultModel(provider: FaqAiProvider): string {
  if (process.env.AI_MODEL?.trim()) {
    return process.env.AI_MODEL.trim();
  }
  return provider === "openai" ? DEFAULT_OPENAI_MODEL : DEFAULT_GEMINI_MODEL;
}

export async function askArteciumFaqAi(
  question: string,
  locale: "pt-PT" | "en",
): Promise<FaqAiResponseBody> {
  const provider = resolveFaqAiProvider();

  if (provider === "openai") {
    const { askArteciumFaqAi: askOpenAi } = await import("@/lib/ai/openai-client");
    return askOpenAi(question, locale);
  }

  const { askArteciumFaqAiGemini } = await import("@/lib/ai/gemini-client");
  return askArteciumFaqAiGemini(question, locale);
}
