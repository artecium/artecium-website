import { ServicePageShell } from "@/components/services/ServicePageShell";
import { ServicesHubPage } from "@/components/services/ServicesHubPage";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import { buildServicesHubMetadata } from "@/lib/services/metadata";

export async function generateMetadata() {
  const t = await getTranslationsForLocale("pt-PT", "services.hub.metadata");

  return buildServicesHubMetadata("pt-PT", {
    title: t("title"),
    description: t("description"),
  });
}

export default function ServicesHubPagePt() {
  return (
    <ServicePageShell locale="pt-PT">
      <ServicesHubPage locale="pt-PT" />
    </ServicePageShell>
  );
}
