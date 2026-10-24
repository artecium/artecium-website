import { SITE_URL } from "@/config/seo";

export function buildAlternateLanguages(ptPath: string, enPath: string) {
  const ptUrl = `${SITE_URL}${ptPath === "/" ? "" : ptPath}`;
  const enUrl = `${SITE_URL}${enPath}`;

  return {
    "pt-PT": ptUrl,
    en: enUrl,
    "x-default": ptUrl,
  };
}
