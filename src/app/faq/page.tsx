import { FaqPage } from "@/components/faq/FaqPage";
import { ServicePageShell } from "@/components/services/ServicePageShell";
import { buildFaqMetadata } from "@/lib/faq/metadata";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";

export async function generateMetadata() {
  const t = await getTranslationsForLocale("pt-PT", "faq.metadata");

  return buildFaqMetadata("pt-PT", {
    title: t("title"),
    description: t("description"),
  });
}

export default function FaqPagePt() {
  return (
    <ServicePageShell locale="pt-PT">
      <FaqPage locale="pt-PT" />
    </ServicePageShell>
  );
}
