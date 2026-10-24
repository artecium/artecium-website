"use client";

import { resolveLocale } from "@/i18n/config";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useId, type RefObject } from "react";

interface DiscoveryPrivacyConsentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  showError?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export function DiscoveryPrivacyConsent({
  checked,
  onChange,
  showError = false,
  inputRef,
}: DiscoveryPrivacyConsentProps) {
  const t = useTranslations("discovery");
  const locale = resolveLocale(useLocale());
  const privacyHref = locale === "en" ? "/en/privacy" : "/privacy";
  const inputId = useId();
  const errorId = useId();

  return (
    <div className="mt-6 text-left">
      <label
        htmlFor={inputId}
        className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-[#050816]/60 p-4 transition-colors duration-200 hover:border-[#334155] ${
          showError
            ? "border-red-500/50 ring-1 ring-red-500/20"
            : "border-[#1E293B]"
        } has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#2563EB]/50 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-[#0E1324]`}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={showError}
          aria-describedby={showError ? errorId : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#334155] bg-[#0E1324] text-[#2563EB] accent-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/50 focus:ring-offset-2 focus:ring-offset-[#050816]"
        />
        <span className="text-sm leading-relaxed text-[#94A3B8]">
          {t.rich("privacyConsent", {
            policyLink: (chunks) => (
              <Link
                href={privacyHref}
                className="font-medium text-[#60A5FA] underline decoration-[#2563EB]/40 underline-offset-2 transition-colors hover:text-[#93C5FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]"
                onClick={(event) => event.stopPropagation()}
              >
                {chunks}
              </Link>
            ),
          })}
        </span>
      </label>

      {showError ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-400">
          {t("privacyConsentRequired")}
        </p>
      ) : null}
    </div>
  );
}
