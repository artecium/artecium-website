import { ServicePageShell } from "@/components/services/ServicePageShell";
import { WebsitesServicePage } from "@/components/services/websites/WebsitesServicePage";
import { buildServicePageMetadata } from "@/lib/services/metadata";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";

export async function generateMetadata() {
  const t = await getTranslationsForLocale("pt-PT", "services.websites.metadata");

  return buildServicePageMetadata("websites", "pt-PT", {
    title: t("title"),
    description: t("description"),
  });
}

export default function WebsitesServicePagePt() {
  return (
    <ServicePageShell locale="pt-PT">
      <WebsitesServicePage locale="pt-PT" />
    </ServicePageShell>
  );
}
