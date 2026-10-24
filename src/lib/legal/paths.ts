import type { AppLocale } from "@/i18n/config";
import type { LegalDocumentId } from "@/content/legal/types";

export function getLegalPath(document: LegalDocumentId, locale: AppLocale): string {
  const segment = document;
  return locale === "en" ? `/en/${segment}` : `/${segment}`;
}

export function getLegalPaths(locale: AppLocale) {
  return {
    privacy: getLegalPath("privacy", locale),
    cookies: getLegalPath("cookies", locale),
    terms: getLegalPath("terms", locale),
  };
}

export function getAlternateLegalPath(
  document: LegalDocumentId,
  currentLocale: AppLocale,
): string {
  const alternateLocale: AppLocale = currentLocale === "en" ? "pt-PT" : "en";
  return getLegalPath(document, alternateLocale);
}
