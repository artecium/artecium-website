import type { AppLocale } from "@/i18n/config";
import { constructMetadata } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/config/seo";
import { buildAlternateLanguages } from "@/lib/seo/hreflang";
import {
  getAlternateServicePath,
  getAlternateServicesHubPath,
  getServicePath,
  getServicesHubPath,
  type ServicePageId,
} from "@/lib/services/paths";

interface ServiceMetadataInput {
  title: string;
  description: string;
}

export function buildServicePageMetadata(
  service: ServicePageId,
  locale: AppLocale,
  meta: ServiceMetadataInput,
) {
  const path = getServicePath(service, locale);
  const ptPath = getServicePath(service, "pt-PT");
  const enPath = getServicePath(service, "en");
  const fullTitle = `${meta.title} | ${SITE_NAME}`;

  return {
    ...constructMetadata({
      title: fullTitle,
      description: meta.description,
      path,
      openGraphLocale: locale === "en" ? "en_US" : "pt_PT",
      alternateLanguages: buildAlternateLanguages(ptPath, enPath),
    }),
    title: { absolute: fullTitle },
  };
}

export function getServiceAlternateHref(
  service: ServicePageId,
  locale: AppLocale,
): string {
  return getAlternateServicePath(service, locale);
}

export function buildServicesHubMetadata(
  locale: AppLocale,
  meta: ServiceMetadataInput,
) {
  const path = getServicesHubPath(locale);
  const ptPath = getServicesHubPath("pt-PT");
  const enPath = getServicesHubPath("en");
  const fullTitle = `${meta.title} | ${SITE_NAME}`;

  return {
    ...constructMetadata({
      title: fullTitle,
      description: meta.description,
      path,
      openGraphLocale: locale === "en" ? "en_US" : "pt_PT",
      alternateLanguages: buildAlternateLanguages(ptPath, enPath),
    }),
    title: { absolute: fullTitle },
  };
}

export function getServicesHubAlternateHref(locale: AppLocale): string {
  return getAlternateServicesHubPath(locale);
}
