import { ServicePageShell } from "@/components/services/ServicePageShell";
import { ServicesHubPage } from "@/components/services/ServicesHubPage";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import { buildServicesHubMetadata } from "@/lib/services/metadata";

export async function generateMetadata() {
  const t = await getTranslationsForLocale("en", "services.hub.metadata");

  return buildServicesHubMetadata("en", {
    title: t("title"),
    description: t("description"),
  });
}

export default function ServicesHubPageEn() {
  return (
    <ServicePageShell locale="en">
      <ServicesHubPage locale="en" />
    </ServicePageShell>
  );
}
