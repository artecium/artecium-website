import { ConversionNudge } from "@/components/home/ConversionNudge";
import { getTranslations } from "next-intl/server";

export async function ServicesConversionNudge() {
  const t = await getTranslations("home.microConversions.services");

  return (
    <div className="px-6 pb-8 sm:px-10 lg:px-16">
      <ConversionNudge
        message={t("message")}
        ctaLabel={t("cta")}
        useDiscovery
      />
    </div>
  );
}

export async function PricingConversionNudge() {
  const t = await getTranslations("home.microConversions.pricing");

  return (
    <div className="relative mx-auto max-w-7xl px-6 pb-8 sm:px-10 lg:px-16">
      <ConversionNudge
        message={t("message")}
        ctaLabel={t("cta")}
        useDiscovery
      />
    </div>
  );
}
