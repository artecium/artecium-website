import type { AppLocale } from "@/i18n/config";
import type { LegalDocumentContent, LegalDocumentId } from "@/content/legal/types";
import { cookiesEn } from "@/content/legal/cookies.en";
import { cookiesPtPt } from "@/content/legal/cookies.pt-PT";
import { privacyEn } from "@/content/legal/privacy.en";
import { privacyPtPt } from "@/content/legal/privacy.pt-PT";
import { termsEn } from "@/content/legal/terms.en";
import { termsPtPt } from "@/content/legal/terms.pt-PT";

const documents: Record<
  LegalDocumentId,
  Record<AppLocale, LegalDocumentContent>
> = {
  privacy: {
    "pt-PT": privacyPtPt,
    en: privacyEn,
  },
  cookies: {
    "pt-PT": cookiesPtPt,
    en: cookiesEn,
  },
  terms: {
    "pt-PT": termsPtPt,
    en: termsEn,
  },
};

export function getLegalContent(
  document: LegalDocumentId,
  locale: AppLocale,
): LegalDocumentContent {
  return documents[document][locale];
}
