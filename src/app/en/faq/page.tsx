import { FaqPage } from "@/components/faq/FaqPage";
import { ServicePageShell } from "@/components/services/ServicePageShell";
import { buildFaqMetadata } from "@/lib/faq/metadata";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";

export async function generateMetadata() {
  const t = await getTranslationsForLocale("en", "faq.metadata");

  return buildFaqMetadata("en", {
    title: t("title"),
    description: t("description"),
  });
}

export default function FaqPageEn() {
  return (
    <ServicePageShell locale="en">
      <FaqPage locale="en" />
    </ServicePageShell>
  );
}
