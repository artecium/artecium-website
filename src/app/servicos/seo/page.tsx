import { SeoServicePage } from "@/components/services/seo/SeoServicePage";
import { ServicePageShell } from "@/components/services/ServicePageShell";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import { buildServicePageMetadata } from "@/lib/services/metadata";

export async function generateMetadata() {
  const t = await getTranslationsForLocale("pt-PT", "services.seo.metadata");

  return buildServicePageMetadata("seo", "pt-PT", {
    title: t("title"),
    description: t("description"),
  });
}

export default function SeoServicePagePt() {
  return (
    <ServicePageShell locale="pt-PT">
      <SeoServicePage locale="pt-PT" />
    </ServicePageShell>
  );
}
