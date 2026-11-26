"use client";

import { setLocale } from "@/i18n/actions";
import { locales, type AppLocale } from "@/i18n/config";
import { isPortalHostname } from "@/lib/routing/portal-host";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useTransition } from "react";

interface LanguageSwitcherProps {
  currentLocale: AppLocale;
  className?: string;
  /** Called after a successful locale switch (e.g. close mobile nav). */
  onLocaleChange?: () => void;
}

const localeLabels: Record<AppLocale, string> = {
  "pt-PT": "PT",
  en: "EN",
};

/** Main marketing site: prefix or strip `/en` in the URL. */
function getMainSiteLocalePath(pathname: string, locale: AppLocale): string {
  if (locale === "en") {
    if (pathname === "/") return "/en";
    if (pathname.startsWith("/en")) return pathname;
    return `/en${pathname}`;
  }

  if (pathname === "/en") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3) || "/";
  return pathname;
}

function isPortalHostClient(): boolean {
  if (typeof window === "undefined") return false;
  return isPortalHostname(window.location.hostname);
}

export function LanguageSwitcher({
  currentLocale,
  className = "",
  onLocaleChange,
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  function handleChange(locale: AppLocale) {
    if (locale === currentLocale || isPending) return;

    const onPortalHost = isPortalHostClient();
    const nextPath = onPortalHost
      ? pathname
      : getMainSiteLocalePath(pathname, locale);

    startTransition(async () => {
      await setLocale(locale, nextPath);
      if (onPortalHost) {
        router.refresh();
      } else {
        router.push(nextPath);
      }
      onLocaleChange?.();
    });
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border border-[#1E293B] bg-[#0E1324] p-0.5 ${className}`}
      role="group"
      aria-label={t("changeLanguage")}
    >
      {locales.map((locale) => {
        const active = locale === currentLocale;

        return (
          <button
            key={locale}
            type="button"
            onClick={() => handleChange(locale)}
            disabled={isPending}
            aria-pressed={active}
            aria-label={locale === "pt-PT" ? "Português" : "English"}
            className={`min-w-[2.25rem] rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 disabled:cursor-not-allowed disabled:opacity-60 ${
              active
                ? "bg-[#2563EB] text-white shadow-[0_0_16px_rgba(37,99,235,0.25)]"
                : "text-[#94A3B8] hover:text-white"
            }`}
          >
            {localeLabels[locale]}
          </button>
        );
      })}
    </div>
  );
}
