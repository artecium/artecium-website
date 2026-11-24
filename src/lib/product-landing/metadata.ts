import type { AppLocale } from "@/i18n/config";
import { constructMetadata } from "@/lib/seo/metadata";
import { buildAlternateLanguages } from "@/lib/seo/hreflang";
import {
  getAlternateBookingMarketingPath,
  getAlternateClientAreaLandingPath,
  getBookingMarketingPath,
  getClientAreaLandingPath,
} from "@/lib/product-landing/paths";

export function buildClientAreaLandingMetadata(
  locale: AppLocale,
  meta: { title: string; description: string },
) {
  const path = getClientAreaLandingPath(locale);
  const altPt = getClientAreaLandingPath("pt-PT");
  const altEn = getClientAreaLandingPath("en");

  return {
    ...constructMetadata({
      title: meta.title,
      description: meta.description,
      path,
      openGraphLocale: locale === "en" ? "en_US" : "pt_PT",
      alternateLanguages: buildAlternateLanguages(altPt, altEn),
    }),
    title: meta.title,
  };
}

export function buildBookingMarketingMetadata(
  locale: AppLocale,
  meta: { title: string; description: string },
) {
  const path = getBookingMarketingPath(locale);
  const altPt = getBookingMarketingPath("pt-PT");
  const altEn = getBookingMarketingPath("en");

  return {
    ...constructMetadata({
      title: meta.title,
      description: meta.description,
      path,
      openGraphLocale: locale === "en" ? "en_US" : "pt_PT",
      alternateLanguages: buildAlternateLanguages(altPt, altEn),
    }),
    title: meta.title,
  };
}

export function getClientAreaLandingAlternateHref(locale: AppLocale): string {
  return getAlternateClientAreaLandingPath(locale);
}

export function getBookingMarketingAlternateHref(locale: AppLocale): string {
  return getAlternateBookingMarketingPath(locale);
}