import { parseFaqModelResponse } from "@/lib/ai/parse-faq-response";
import { buildFaqSystemPrompt } from "@/lib/ai/system-prompt";
import type { FaqAiResponseBody } from "@/lib/ai/types";

const DEFAULT_MODEL = "gemini-2.5-flash";
const REQUEST_TIMEOUT_MS = 25_000;
const MAX_OUTPUT_TOKENS = 1200;
const MAX_ATTEMPTS = 2;
const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface GeminiErrorResponse {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: unknown;
  };
}

type ParseOutcome =
  | { ok: true; data: FaqAiResponseBody }
  | { ok: false; reason: "empty" | "parse" | "wrapper" };

const isDev = process.env.NODE_ENV === "development";

function sanitizeErrorBody(body: string): string {
  return body
    .replace(/AIza[0-9A-Za-z\-_]{30,}/g, "[REDACTED_API_KEY]")
    .replace(/AQ\.[A-Za-z0-9\-_]{20,}/g, "[REDACTED_API_KEY]")
    .replace(/x-goog-api-key[^\n]*/gi, "[REDACTED_HEADER]")
    .slice(0, 1000);
}

function logGeminiFailure(
  model: string,
  httpStatus: number,
  payload: GeminiErrorResponse | string,
  rawBody?: string,
) {
  if (!isDev) return;

  if (typeof payload === "string") {
    console.error("[faq-ai] Gemini request failed", {
      httpStatus,
      model,
      errorType: null,
      errorCode: null,
      errorMessage: payload.slice(0, 500),
      errorBody: rawBody ? sanitizeErrorBody(rawBody) : undefined,
    });
    return;
  }

  console.error("[faq-ai] Gemini request failed", {
    httpStatus,
    model,
    errorType: payload.error?.status ?? null,
    errorCode: payload.error?.code ?? null,
    errorMessage: payload.error?.message ?? null,
    errorBody: rawBody ? sanitizeErrorBody(rawBody) : undefined,
  });
}

function logGeminiAttempt(details: {
  attempt: number;
  model: string;
  httpStatus: number;
  parseSuccess: boolean;
  parseFailureReason?: string;
}) {
  console.info("[faq-ai] Gemini attempt", details);
}

function buildFallbackResponse(locale: "pt-PT" | "en"): FaqAiResponseBody {
  return {
    answer:
      locale === "en"
        ? "I couldn't generate a complete answer right now. Try rephrasing your question or contact Artecium."
        : "Não consegui gerar uma resposta completa neste momento. Tenta reformular a pergunta ou contacta a Artecium.",
    linkKey: "contact",
    hasInformation: false,
  };
}

async function requestGeminiContent(
  question: string,
  locale: "pt-PT" | "en",
  attempt: number,
  apiKey: string,
  model: string,
  signal: AbortSignal,
): Promise<{ httpStatus: number; content: string | null }> {
  const endpoint = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent`;
  const shorter = attempt > 1;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: buildFaqSystemPrompt(locale, { shorter }) }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: question }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        responseMimeType: "application/json",
      },
    }),
    signal,
  });

  const responseText = await response.text();

  if (!response.ok) {
    let errorPayload: GeminiErrorResponse | string = responseText;

    try {
      errorPayload = JSON.parse(responseText) as GeminiErrorResponse;
    } catch {
      // keep raw text for logging
    }

    logGeminiFailure(model, response.status, errorPayload, responseText);
    throw new Error(`Provider request failed (${response.status})`);
  }

  let data: GeminiGenerateResponse;
  try {
    data = JSON.parse(responseText) as GeminiGenerateResponse;
  } catch {
    return { httpStatus: response.status, content: null };
  }

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  return { httpStatus: response.status, content };
}

function parseGeminiContent(content: string | null): ParseOutcome {
  if (!content) {
    return { ok: false, reason: "empty" };
  }

  try {
    return { ok: true, data: parseFaqModelResponse(content) };
  } catch {
    return { ok: false, reason: "parse" };
  }
}

export async function askArteciumFaqAiGemini(
  question: string,
  locale: "pt-PT" | "en",
): Promise<FaqAiResponseBody> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const { httpStatus, content } = await requestGeminiContent(
        question,
        locale,
        attempt,
        apiKey,
        model,
        controller.signal,
      );

      const outcome = parseGeminiContent(content);

      if (outcome.ok) {
        logGeminiAttempt({
          attempt,
          model,
          httpStatus,
          parseSuccess: true,
        });
        return outcome.data;
      }

      logGeminiAttempt({
        attempt,
        model,
        httpStatus,
        parseSuccess: false,
        parseFailureReason: outcome.reason,
      });

      if (attempt < MAX_ATTEMPTS) {
        continue;
      }

      return buildFallbackResponse(locale);
    }

    return buildFallbackResponse(locale);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[faq-ai] Gemini request timed out", {
        model,
        timeoutMs: REQUEST_TIMEOUT_MS,
      });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
