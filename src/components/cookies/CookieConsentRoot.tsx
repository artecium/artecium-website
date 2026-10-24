"use client";

import { ConsentAwareAnalytics } from "@/components/analytics/ConsentAwareAnalytics";
import { CookieConsentBanner } from "@/components/cookies/CookieConsentBanner";
import { CookiePreferences } from "@/components/cookies/CookiePreferences";
import { CookieConsentProvider } from "@/context/CookieConsentContext";
import type { AppLocale } from "@/i18n/config";
import { NextIntlClientProvider } from "next-intl";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import enMessages from "@/i18n/messages/en.json";
import ptMessages from "@/i18n/messages/pt-PT.json";

function resolveRouteLocale(pathname: string): AppLocale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "pt-PT";
}

function CookieConsentLocaleShell() {
  const pathname = usePathname();
  const locale = resolveRouteLocale(pathname);
  const messages =
    locale === "en"
      ? { cookies: enMessages.cookies }
      : { cookies: ptMessages.cookies };

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <CookieConsentBanner />
      <CookiePreferences />
    </NextIntlClientProvider>
  );
}

export function CookieConsentRoot({ children }: { children: ReactNode }) {
  return (
    <CookieConsentProvider>
      {children}
      <CookieConsentLocaleShell />
      <ConsentAwareAnalytics />
    </CookieConsentProvider>
  );
}
