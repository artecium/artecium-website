import { SeoServicePage } from "@/components/services/seo/SeoServicePage";
import { ServicePageShell } from "@/components/services/ServicePageShell";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import { buildServicePageMetadata } from "@/lib/services/metadata";

export async function generateMetadata() {
  const t = await getTranslationsForLocale("en", "services.seo.metadata");

  return buildServicePageMetadata("seo", "en", {
    title: t("title"),
    description: t("description"),
  });
}

export default function SeoServicePageEn() {
  return (
    <ServicePageShell locale="en">
      <SeoServicePage locale="en" />
    </ServicePageShell>
  );
}
