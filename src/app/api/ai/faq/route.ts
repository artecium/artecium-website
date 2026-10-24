import {
  askArteciumFaqAi,
  getFaqAiDefaultModel,
  isFaqAiProviderConfigured,
  resolveFaqAiProvider,
} from "@/lib/ai/faq-ai-provider";
import { checkRateLimit, getClientIp } from "@/lib/ai/rate-limit";
import type { FaqAiRequestBody } from "@/lib/ai/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_QUESTION_LENGTH = 500;
const MIN_QUESTION_LENGTH = 3;

function sanitizeQuestion(input: string): string {
  return input.replace(/\0/g, "").trim();
}

function resolveLocale(value: unknown): "pt-PT" | "en" {
  return value === "en" ? "en" : "pt-PT";
}

export async function POST(request: Request) {
  const provider = resolveFaqAiProvider();

  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`faq-ai:${ip}`);

    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          code: "RATE_LIMIT",
        },
        {
          status: 429,
          headers: rate.retryAfterSeconds
            ? { "Retry-After": String(rate.retryAfterSeconds) }
            : undefined,
        },
      );
    }

    let body: FaqAiRequestBody;
    try {
      body = (await request.json()) as FaqAiRequestBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body.", code: "VALIDATION" },
        { status: 400 },
      );
    }

    const question = sanitizeQuestion(body.question ?? "");
    const locale = resolveLocale(body.locale);

    if (question.length < MIN_QUESTION_LENGTH) {
      return NextResponse.json(
        { error: "Question is too short.", code: "VALIDATION" },
        { status: 400 },
      );
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        { error: "Question is too long.", code: "VALIDATION" },
        { status: 400 },
      );
    }

    if (!isFaqAiProviderConfigured(provider)) {
      return NextResponse.json(
        { error: "AI assistant is not configured.", code: "CONFIG" },
        { status: 503 },
      );
    }

    if (provider === "gemini") {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey && geminiKey !== geminiKey.trim()) {
        console.warn("[faq-ai] GEMINI_API_KEY has leading or trailing whitespace");
      }
    } else {
      const openAiKey = process.env.AI_API_KEY;
      if (openAiKey && openAiKey !== openAiKey.trim()) {
        console.warn("[faq-ai] AI_API_KEY has leading or trailing whitespace");
      }
    }

    const result = await askArteciumFaqAi(question, locale);
    return NextResponse.json(result);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[faq-ai] Route handler failed", {
        message: error instanceof Error ? error.message : "unknown",
        name: error instanceof Error ? error.name : undefined,
        provider,
        model: getFaqAiDefaultModel(provider),
        apiKeyConfigured: isFaqAiProviderConfigured(provider),
      });
    }

    return NextResponse.json(
      { error: "Unable to process the question.", code: "PROVIDER" },
      { status: 502 },
    );
  }
}
