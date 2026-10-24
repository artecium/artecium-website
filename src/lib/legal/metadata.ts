import { getLegalContent } from "@/content/legal";
import type { LegalDocumentId } from "@/content/legal/types";
import type { AppLocale } from "@/i18n/config";
import { SITE_NAME } from "@/config/seo";
import { buildAlternateLanguages } from "@/lib/seo/hreflang";
import { constructMetadata } from "@/lib/seo/metadata";
import { getLegalPath } from "@/lib/legal/paths";

export function buildLegalMetadata(document: LegalDocumentId, locale: AppLocale) {
  const content = getLegalContent(document, locale);
  const path = getLegalPath(document, locale);
  const ptPath = getLegalPath(document, "pt-PT");
  const enPath = getLegalPath(document, "en");
  const fullTitle = `${content.title} | ${SITE_NAME}`;

  return {
    ...constructMetadata({
      title: fullTitle,
      description: content.description,
      path,
      openGraphLocale: locale === "en" ? "en_US" : "pt_PT",
      alternateLanguages: buildAlternateLanguages(ptPath, enPath),
    }),
    title: { absolute: fullTitle },
  };
}
