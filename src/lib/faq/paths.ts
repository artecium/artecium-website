import type { AppLocale } from "@/i18n/config";

export function getFaqPath(locale: AppLocale): string {
  return locale === "en" ? "/en/faq" : "/faq";
}

export function getAlternateFaqPath(currentLocale: AppLocale): string {
  const alternateLocale: AppLocale = currentLocale === "en" ? "pt-PT" : "en";
  return getFaqPath(alternateLocale);
}
