"use client";

import { ConsentAwareAnalytics } from "@/components/analytics/ConsentAwareAnalytics";
import { CookieConsentBanner } from "@/components/cookies/CookieConsentBanner";
import { CookiePreferences } from "@/components/cookies/CookiePreferences";
import { CookieConsentProvider } from "@/context/CookieConsentContext";
import { resolveLocale, type AppLocale } from "@/i18n/config";
import { NextIntlClientProvider, useLocale } from "next-intl";
import type { ReactNode } from "react";

import enMessages from "@/i18n/messages/en.json";
import ptMessages from "@/i18n/messages/pt-PT.json";

function CookieConsentLocaleShell() {
  const locale: AppLocale = resolveLocale(useLocale());
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
