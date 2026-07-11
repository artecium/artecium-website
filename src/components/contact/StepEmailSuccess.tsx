"use client";

import { useState } from "react";
import { WizardFooter, WizardStep } from "@/components/contact/WizardStep";
import type { UseProjectDiscoveryReturn } from "@/hooks/useProjectDiscovery";

interface StepEmailSuccessProps {
  wizard: UseProjectDiscoveryReturn;
}

export function StepEmailSuccess({ wizard }: StepEmailSuccessProps) {
  const { data, direction, prev, close } = wizard;
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to send request");
      }

      setIsSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <WizardStep
      headline="Your Discovery Brief is ready."
      subtitle="Every successful project starts with a great conversation. We look forward to learning more about your business."
      direction={direction}
      footer={
        isSent ? (
          <div className="flex justify-center border-t border-[#1E293B]/60 pt-6">
            <button
              type="button"
              onClick={close}
              className="rounded-full bg-[#2563EB] px-6 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-[#1D4ED8] hover:shadow-[0_0_24px_rgba(37,99,235,0.35)]"
            >
              Done
            </button>
          </div>
        ) : (
          <WizardFooter
            onPrevious={prev}
            onContinue={handleSend}
            continueLabel="Send Request"
            canContinue={!isSending}
            isLoading={isSending}
            showPrevious
          />
        )
      }
    >
      <div className="rounded-2xl border border-[#1E293B] bg-[#050816] p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2563EB]/30 bg-[#2563EB]/10 text-[#2563EB]">
          {isSent ? (
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25V6.75m9 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 00-1.07-1.916l-7.5-4.615a2.25 2.25 0 00-2.36 0L3.32 8.91a2.25 2.25 0 00-1.07 1.916V19.5a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V6.75z" />
            </svg>
          )}
        </div>

        {isSent ? (
          <p className="text-sm leading-relaxed text-[#94A3B8]">
            Thank you, {data.name.split(" ")[0]}. We&apos;ve received your Discovery Brief and will be in touch shortly.
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-[#94A3B8]">
            Review complete. When you&apos;re ready, send your brief and we&apos;ll prepare for your first conversation.
          </p>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    </WizardStep>
  );
}
