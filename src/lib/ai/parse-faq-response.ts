import type { FaqAiResponseBody } from "@/lib/ai/types";

export function parseFaqModelResponse(content: string): FaqAiResponseBody {
  const parsed = JSON.parse(content) as Partial<FaqAiResponseBody>;

  if (typeof parsed.answer !== "string" || parsed.answer.trim().length === 0) {
    throw new Error("Invalid model response shape");
  }

  const linkKey = parsed.linkKey ?? null;
  const validKeys = ["websites", "ia", "seo", "services", "contact", null];
  if (!validKeys.includes(linkKey)) {
    return {
      answer: parsed.answer.trim(),
      linkKey: null,
      hasInformation: parsed.hasInformation !== false,
    };
  }

  return {
    answer: parsed.answer.trim(),
    linkKey,
    hasInformation: parsed.hasInformation !== false,
  };
}
