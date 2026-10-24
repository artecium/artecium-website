import { SITE_SERVICES } from "@/config/seo";
import { intlLocale, resolveLocale } from "@/i18n/config";
import { getStructuredDataGraph } from "@/lib/seo/json-ld";
import { getLocale, getTranslations } from "next-intl/server";

export async function StructuredData() {
  const locale = resolveLocale(await getLocale());
  const t = await getTranslations({ locale, namespace: "metadata" });
  const services = await getTranslations({ locale, namespace: "home.services" });

  const serviceNames = [
    services("websites.title"),
    services("aiAutomation.title"),
    services("seo.title"),
    services("webApplications.title"),
    services("customSoftware.title"),
    services("cloudSolutions.title"),
    services("businessSystems.title"),
    services("mobileApps.title"),
  ];

  const structuredData = getStructuredDataGraph({
    description: t("siteDescription"),
    inLanguage: intlLocale(locale),
    services: serviceNames.length > 0 ? serviceNames : [...SITE_SERVICES],
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
