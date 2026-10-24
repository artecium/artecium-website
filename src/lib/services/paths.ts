import type { AppLocale } from "@/i18n/config";

export const SERVICE_PAGES = {
  websites: "websites",
  ia: "ia",
  seo: "seo",
} as const;

export type ServicePageId =
  (typeof SERVICE_PAGES)[keyof typeof SERVICE_PAGES];

const SERVICE_SEGMENTS: Record<ServicePageId, string> = {
  websites: "/servicos/websites",
  ia: "/servicos/ia",
  seo: "/servicos/seo",
};

export function getServicePath(
  service: ServicePageId,
  locale: AppLocale,
): string {
  const segment = SERVICE_SEGMENTS[service];
  return locale === "en" ? `/en${segment}` : segment;
}

export function getAlternateServicePath(
  service: ServicePageId,
  currentLocale: AppLocale,
): string {
  const alternateLocale: AppLocale = currentLocale === "en" ? "pt-PT" : "en";
  return getServicePath(service, alternateLocale);
}

export function getServicesHubPath(locale: AppLocale): string {
  return locale === "en" ? "/en/servicos" : "/servicos";
}

export function getAlternateServicesHubPath(currentLocale: AppLocale): string {
  const alternateLocale: AppLocale = currentLocale === "en" ? "pt-PT" : "en";
  return getServicesHubPath(alternateLocale);
}

export const PUBLIC_SERVICE_IDS = [
  SERVICE_PAGES.websites,
  SERVICE_PAGES.ia,
  SERVICE_PAGES.seo,
] as const satisfies readonly ServicePageId[];
