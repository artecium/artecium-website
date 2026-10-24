import { AiServicePage } from "@/components/services/ai/AiServicePage";
import { ServicePageShell } from "@/components/services/ServicePageShell";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import { buildServicePageMetadata } from "@/lib/services/metadata";

export async function generateMetadata() {
  const t = await getTranslationsForLocale("en", "services.ai.metadata");

  return buildServicePageMetadata("ia", "en", {
    title: t("title"),
    description: t("description"),
  });
}

export default function AiServicePageEn() {
  return (
    <ServicePageShell locale="en">
      <AiServicePage locale="en" />
    </ServicePageShell>
  );
}
