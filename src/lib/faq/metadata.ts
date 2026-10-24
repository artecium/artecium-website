import type { AppLocale } from "@/i18n/config";
import { constructMetadata } from "@/lib/seo/metadata";
import { buildAlternateLanguages } from "@/lib/seo/hreflang";
import { getAlternateFaqPath, getFaqPath } from "@/lib/faq/paths";

interface FaqMetadataInput {
  title: string;
  description: string;
}

export function buildFaqMetadata(locale: AppLocale, meta: FaqMetadataInput) {
  const path = getFaqPath(locale);
  const ptPath = getFaqPath("pt-PT");
  const enPath = getFaqPath("en");

  return {
    ...constructMetadata({
      title: meta.title,
      description: meta.description,
      path,
      openGraphLocale: locale === "en" ? "en_US" : "pt_PT",
      alternateLanguages: buildAlternateLanguages(ptPath, enPath),
    }),
    title: meta.title,
  };
}

export function getFaqAlternateHref(locale: AppLocale): string {
  return getAlternateFaqPath(locale);
}
