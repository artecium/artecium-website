"use client";

import { useCookieConsent } from "@/context/CookieConsentContext";
import { resolveLocale } from "@/i18n/config";
import { getLegalPath } from "@/lib/legal/paths";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export function CookieConsentBanner() {
  const t = useTranslations("cookies");
  const locale = resolveLocale(useLocale());
  const cookiesPolicyHref = getLegalPath("cookies", locale);
  const { showBanner, acceptAll, rejectOptional, openPreferences } = useCookieConsent();

  if (!showBanner) return null;

  return (
    <div
      role="region"
      aria-label={t("bannerLabel")}
      className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6"
    >
      <div className="pointer-events-none mx-auto max-w-4xl">
        <div className="pointer-events-auto relative overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0E1324]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#2563EB]/[0.04] to-transparent" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-base font-semibold text-white sm:text-lg">
                {t("title")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
                {t("description")}{" "}
                <Link
                  href={cookiesPolicyHref}
                  className="font-medium text-[#60A5FA] underline decoration-[#2563EB]/40 underline-offset-2 transition-colors hover:text-[#93C5FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E1324]"
                >
                  {t("cookiePolicy")}
                </Link>
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:shrink-0">
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-[0_0_24px_rgba(37,99,235,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E1324]"
              >
                {t("acceptAll")}
              </button>
              <button
                type="button"
                onClick={rejectOptional}
                className="rounded-full border border-[#334155] bg-[#050816] px-5 py-2.5 text-sm font-medium text-[#E2E8F0] transition-all duration-200 hover:border-[#475569] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E1324]"
              >
                {t("rejectOptional")}
              </button>
              <button
                type="button"
                onClick={openPreferences}
                className="rounded-full border border-[#1E293B] px-5 py-2.5 text-sm font-medium text-[#94A3B8] transition-all duration-200 hover:border-[#334155] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E1324]"
              >
                {t("customize")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
