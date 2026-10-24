import { parseFaqModelResponse } from "@/lib/ai/parse-faq-response";
import { buildFaqSystemPrompt } from "@/lib/ai/system-prompt";
import type { FaqAiResponseBody } from "@/lib/ai/types";

const DEFAULT_MODEL = "gpt-4o-mini";
const REQUEST_TIMEOUT_MS = 25_000;

interface OpenAiChatResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

interface OpenAiErrorResponse {
  error?: {
    message?: string;
    type?: string;
    code?: string | null;
  };
}

function logOpenAiFailure(
  model: string,
  httpStatus: number,
  payload: OpenAiErrorResponse | string,
) {
  if (typeof payload === "string") {
    console.error("[faq-ai] OpenAI request failed", {
      httpStatus,
      model,
      errorMessage: payload.slice(0, 500),
    });
    return;
  }

  console.error("[faq-ai] OpenAI request failed", {
    httpStatus,
    model,
    errorType: payload.error?.type,
    errorCode: payload.error?.code ?? null,
    errorMessage: payload.error?.message,
  });
}

export async function askArteciumFaqAi(
  question: string,
  locale: "pt-PT" | "en",
): Promise<FaqAiResponseBody> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error("AI_API_KEY is not configured");
  }

  const model = process.env.AI_MODEL ?? DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildFaqSystemPrompt(locale) },
          { role: "user", content: question },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorPayload: OpenAiErrorResponse | string = errorText;

      try {
        errorPayload = JSON.parse(errorText) as OpenAiErrorResponse;
      } catch {
        // keep raw text for logging
      }

      logOpenAiFailure(model, response.status, errorPayload);
      throw new Error(`Provider request failed (${response.status})`);
    }

    const data = (await response.json()) as OpenAiChatResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("[faq-ai] OpenAI returned empty content", { model });
      throw new Error("Empty provider response");
    }

    try {
      return parseFaqModelResponse(content);
    } catch (error) {
      console.error("[faq-ai] Failed to parse model JSON response", {
        model,
        message: error instanceof Error ? error.message : "unknown",
        contentPreview: content.slice(0, 200),
      });
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[faq-ai] OpenAI request timed out", {
        model: process.env.AI_MODEL ?? DEFAULT_MODEL,
        timeoutMs: REQUEST_TIMEOUT_MS,
      });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
