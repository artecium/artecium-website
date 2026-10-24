import { AiServicePage } from "@/components/services/ai/AiServicePage";
import { ServicePageShell } from "@/components/services/ServicePageShell";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import { buildServicePageMetadata } from "@/lib/services/metadata";

export async function generateMetadata() {
  const t = await getTranslationsForLocale("pt-PT", "services.ai.metadata");

  return buildServicePageMetadata("ia", "pt-PT", {
    title: t("title"),
    description: t("description"),
  });
}

export default function AiServicePagePt() {
  return (
    <ServicePageShell locale="pt-PT">
      <AiServicePage locale="pt-PT" />
    </ServicePageShell>
  );
}
