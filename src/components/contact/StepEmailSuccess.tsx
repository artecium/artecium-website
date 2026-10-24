"use client";

import { useTranslations } from "next-intl";
import { DiscoveryPrivacyConsent } from "@/components/contact/DiscoveryPrivacyConsent";
import { WizardFooter, WizardStep } from "@/components/contact/WizardStep";
import type { UseProjectDiscoveryReturn } from "@/hooks/useProjectDiscovery";
import { useRef, useState } from "react";

interface StepEmailSuccessProps {
  wizard: UseProjectDiscoveryReturn;
}

export function StepEmailSuccess({ wizard }: StepEmailSuccessProps) {
  const t = useTranslations("discovery");
  const { data, direction, prev, close } = wizard;
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsentError, setShowConsentError] = useState(false);
  const consentRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!hasConsent) {
      setShowConsentError(true);
      consentRef.current?.focus();
      return;
    }

    setIsSending(true);
    setError(null);
    setShowConsentError(false);

    try {
      const response = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? t("errors.sendFailed"));
      }

      setIsSent(true);
    } catch {
      setError(t("errors.sendFailed"));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <WizardStep
      headline={t("emailSuccess.headline")}
      subtitle={t("emailSuccess.subtitle")}
      direction={direction}
      footer={
        isSent ? (
          <div className="flex justify-center border-t border-[#1E293B]/60 pt-6">
            <button
              type="button"
              onClick={close}
              className="rounded-full bg-[#2563EB] px-6 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-[#1D4ED8] hover:shadow-[0_0_24px_rgba(37,99,235,0.35)]"
            >
              {t("emailSuccess.done")}
            </button>
          </div>
        ) : (
          <WizardFooter
            onPrevious={prev}
            onContinue={handleSend}
            continueLabel={t("emailSuccess.sendRequest")}
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
            {t("emailSuccess.thankYou", { name: data.name.split(" ")[0] })}
          </p>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-[#94A3B8]">
              {t("emailSuccess.reviewComplete")}
            </p>
            <DiscoveryPrivacyConsent
              checked={hasConsent}
              onChange={(checked) => {
                setHasConsent(checked);
                if (checked) setShowConsentError(false);
              }}
              showError={showConsentError}
              inputRef={consentRef}
            />
          </>
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
