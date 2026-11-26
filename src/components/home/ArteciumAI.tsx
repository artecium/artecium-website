"use client";

import { StartProjectButton } from "@/components/contact/StartProjectButton";
import { resolveLocale } from "@/i18n/config";
import type { FaqAiResponseBody, FaqLinkKey } from "@/lib/ai/types";
import { getServicePath, getServicesHubPath } from "@/lib/services/paths";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";

const EXAMPLE_KEYS = [
  "websiteCost",
  "professionalPlan",
  "whatIsSeo",
  "automation",
  "webApps",
] as const;

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  linkKey?: FaqLinkKey | null;
  hasInformation?: boolean;
  isError?: boolean;
}

function resolveLinkHref(
  linkKey: FaqLinkKey,
  locale: ReturnType<typeof resolveLocale>,
): string | null {
  switch (linkKey) {
    case "websites":
      return getServicePath("websites", locale);
    case "ia":
      return getServicePath("ia", locale);
    case "seo":
      return getServicePath("seo", locale);
    case "services":
      return getServicesHubPath(locale);
    case "contact":
      return null;
  }
}

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-1.5 w-1.5 rounded-full bg-[#60A5FA] motion-safe:animate-ai-dot motion-reduce:opacity-70"
          style={{ animationDelay: `${index * 0.18}s` }}
        />
      ))}
    </span>
  );
}

interface ArteciumAIProps {
  /** Side column on FAQ — layout only; same behaviour and API. */
  embedded?: boolean;
}

export function ArteciumAI({ embedded = false }: ArteciumAIProps) {
  const t = useTranslations("home.aiAssistant");
  const locale = resolveLocale(useLocale());
  const formId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuestion, setLastQuestion] = useState("");

  const getLinkLabel = useCallback(
    (linkKey: FaqLinkKey): string => {
      switch (linkKey) {
        case "websites":
          return t("links.websites");
        case "ia":
          return t("links.ia");
        case "seo":
          return t("links.seo");
        case "services":
          return t("links.services");
        case "contact":
          return t("links.contact");
      }
    },
    [t],
  );

  const submitQuestion = useCallback(
    async (rawQuestion: string) => {
      const trimmed = rawQuestion.trim();
      if (trimmed.length < 3 || isLoading) return;

      setIsLoading(true);
      setLastQuestion(trimmed);
      setQuestion("");

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await fetch("/api/ai/faq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: trimmed, locale }),
        });

        if (!response.ok) {
          throw new Error("request_failed");
        }

        const data = (await response.json()) as FaqAiResponseBody;

        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.answer,
            linkKey: data.linkKey,
            hasInformation: data.hasInformation,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: t("errors.generic"),
            isError: true,
          },
        ]);
      } finally {
        setIsLoading(false);
        requestAnimationFrame(() => {
          responseRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      }
    },
    [isLoading, locale, t],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitQuestion(question);
  };

  const handleExampleClick = (key: (typeof EXAMPLE_KEYS)[number]) => {
    const example = t(`examples.${key}`);
    setQuestion(example);
    void submitQuestion(example);
  };

  const handleRetry = () => {
    if (lastQuestion) void submitQuestion(lastQuestion);
  };

  const shellClass = embedded
    ? "h-full rounded-2xl border border-[#1E293B] bg-[#0E1324]/70 p-5 backdrop-blur-sm sm:p-6"
    : "mt-16 rounded-2xl border border-[#1E293B] bg-[#0E1324]/70 p-6 backdrop-blur-sm sm:p-8";

  const headingWrapClass = embedded
    ? "text-left"
    : "mx-auto max-w-2xl text-center";

  const bodyWrapClass = embedded ? "mt-6 max-w-none" : "mx-auto mt-8 max-w-2xl";

  return (
    <div className={shellClass} aria-labelledby={`${formId}-heading`}>
      <div className={headingWrapClass}>
        <h3
          id={`${formId}-heading`}
          className="text-xl font-semibold text-white sm:text-2xl"
        >
          {t("title")}
        </h3>
        <p className="mt-2 text-sm font-medium text-[#60A5FA]">{t("subtitle")}</p>
        <p className="mt-3 text-sm leading-relaxed text-[#94A3B8]">
          {t("description")}
        </p>
      </div>

      <div className={bodyWrapClass}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#1E293B] bg-[#050816]">
            <Image
              src="/artecium-logo.png"
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
              aria-hidden="true"
            />
          </div>
          <p className="text-sm font-semibold text-white">{t("assistantLabel")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor={`${formId}-input`} className="sr-only">
            {t("inputLabel")}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              ref={inputRef}
              id={`${formId}-input`}
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={t("inputPlaceholder")}
              maxLength={500}
              disabled={isLoading}
              className="h-12 flex-1 rounded-xl border border-[#1E293B] bg-[#050816]/80 px-4 text-sm text-white placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || question.trim().length < 3}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-[#2563EB] px-5 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("submit")}
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLE_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              disabled={isLoading}
              onClick={() => handleExampleClick(key)}
              className="rounded-full border border-[#1E293B] bg-[#050816]/60 px-3 py-1.5 text-xs text-[#94A3B8] transition-colors hover:border-[#2563EB]/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 disabled:opacity-50"
            >
              {t(`examples.${key}`)}
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-[#64748B]">
          {t("privacyNote")}
        </p>

        {(messages.length > 0 || isLoading) && (
          <div
            ref={responseRef}
            className="mt-8 space-y-4 border-t border-[#1E293B]/80 pt-6"
            aria-live="polite"
            aria-busy={isLoading}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl border px-4 py-3 text-sm leading-relaxed sm:max-w-[85%] ${
                    message.role === "user"
                      ? "border-[#2563EB]/30 bg-[#2563EB]/10 text-white"
                      : message.isError
                        ? "border-[#1E293B] bg-[#050816]/80 text-[#94A3B8]"
                        : "border-[#1E293B] bg-[#050816]/80 text-[#CBD5E1]"
                  }`}
                >
                  {message.role === "assistant" && !message.isError && (
                    <p className="mb-2 text-[0.625rem] font-semibold tracking-[0.2em] text-[#60A5FA] uppercase">
                      {t("assistantName")}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {message.role === "assistant" &&
                    !message.isError &&
                    (message.linkKey || message.hasInformation === false) && (
                    <div className="mt-3">
                      {!message.hasInformation || message.linkKey === "contact" ? (
                        <StartProjectButton className="h-9 px-4 text-xs">
                          {t("links.contact")}
                        </StartProjectButton>
                      ) : message.linkKey ? (
                        (() => {
                          const href = resolveLinkHref(message.linkKey, locale);
                          return href ? (
                            <Link
                              href={href}
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#60A5FA] transition-colors hover:text-[#93C5FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                            >
                              {getLinkLabel(message.linkKey)}
                              <span aria-hidden="true">→</span>
                            </Link>
                          ) : null;
                        })()
                      ) : null}
                    </div>
                  )}

                  {message.isError && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="text-xs font-medium text-[#60A5FA] hover:text-[#93C5FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                      >
                        {t("errors.retry")}
                      </button>
                      <StartProjectButton variant="secondary" className="h-9 px-4 text-xs">
                        {t("errors.contact")}
                      </StartProjectButton>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-[#1E293B] bg-[#050816]/80 px-4 py-3">
                  <p className="mb-2 text-[0.625rem] font-semibold tracking-[0.2em] text-[#60A5FA] uppercase">
                    {t("assistantName")}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-[#94A3B8]">
                    {t("loading")}
                    <LoadingDots />
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
