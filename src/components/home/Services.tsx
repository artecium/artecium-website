import { SectionHeader } from "@/components/ui/SectionHeader";
import { SERVICE_CARD_IMAGES } from "@/components/home/services/service-images";
import { ServicesExpandableGrid } from "@/components/home/services/ServicesExpandableGrid";
import {
  PRIMARY_SERVICE_KEYS,
  type PrimaryServiceKey,
} from "@/components/home/services/types";
import { resolveRequestLocale } from "@/lib/i18n/resolve-locale";
import { getServicePath, type ServicePageId } from "@/lib/services/paths";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";

const primaryServicePaths: Record<PrimaryServiceKey, ServicePageId> = {
  websites: "websites",
  aiAutomation: "ia",
  seo: "seo",
};

const serviceImageAltKeys: Record<PrimaryServiceKey, string> = {
  websites: "imageAltWebsites",
  aiAutomation: "imageAltAi",
  seo: "imageAltSeo",
};

export async function Services() {
  const locale = await resolveRequestLocale();
  const t = await getTranslationsForLocale(locale, "home.services");

  const items = PRIMARY_SERVICE_KEYS.map((key) => ({
    id: key,
    imageSrc: SERVICE_CARD_IMAGES[key],
    imageAlt: t(serviceImageAltKeys[key]),
    title: t(`${key}.title`),
    intro: t(`${key}.description`),
    forWho: t(`${key}.forWho`),
    includes: t(`${key}.includes`),
    ctaLabel: t(`${key}.cta`),
    href: getServicePath(primaryServicePaths[key], locale),
    openDetailsAria: t("openServiceDetails", { title: t(`${key}.title`) }),
  }));

  const labels = {
    includesHeading: t("includesHeading"),
    forWhoHeading: t("forWhoHeading"),
    closeModalAria: t("closeModalAria"),
    expandHint: t("expandHint"),
  };

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="px-6 py-24 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          titleId="services-heading"
        />

        <ServicesExpandableGrid items={items} labels={labels} />

        <p className="mx-auto mt-12 max-w-3xl text-center text-sm leading-relaxed text-[#64748B]">
          {t("complementarySummary")}
        </p>
      </div>
    </section>
  );
}