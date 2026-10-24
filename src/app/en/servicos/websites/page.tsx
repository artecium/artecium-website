import { ServicePageShell } from "@/components/services/ServicePageShell";
import { WebsitesServicePage } from "@/components/services/websites/WebsitesServicePage";
import { buildServicePageMetadata } from "@/lib/services/metadata";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";

export async function generateMetadata() {
  const t = await getTranslationsForLocale("en", "services.websites.metadata");

  return buildServicePageMetadata("websites", "en", {
    title: t("title"),
    description: t("description"),
  });
}

export default function WebsitesServicePageEn() {
  return (
    <ServicePageShell locale="en">
      <WebsitesServicePage locale="en" />
    </ServicePageShell>
  );
}
