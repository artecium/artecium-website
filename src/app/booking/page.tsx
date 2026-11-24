import { ProductLandingPage } from "@/components/product-landing/ProductLandingPage";
import { buildBookingMarketingMetadata } from "@/lib/product-landing/metadata";
import {
  BOOKING_MARKETING_DEMO_PATH,
  BOOKING_PUBLIC_ORIGIN,
  getBookingMarketingPath,
} from "@/lib/product-landing/paths";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";

const META_TITLE = "Booking — Sistema de Marcações Online | Artecium";

export async function generateMetadata() {
  const t = await getTranslationsForLocale("pt-PT", "productLanding.booking.meta");

  return buildBookingMarketingMetadata("pt-PT", {
    title: META_TITLE,
    description: t("description"),
  });
}

export default async function BookingMarketingPtPage() {
  const t = await getTranslationsForLocale("pt-PT", "productLanding.booking");
  const path = getBookingMarketingPath("pt-PT");
  const demoUrl = `${BOOKING_PUBLIC_ORIGIN}${BOOKING_MARKETING_DEMO_PATH}`;

  const features = [
    { title: t("features.online.title"), description: t("features.online.description") },
    { title: t("features.calendar.title"), description: t("features.calendar.description") },
    { title: t("features.team.title"), description: t("features.team.description") },
    { title: t("features.brand.title"), description: t("features.brand.description") },
  ];

  return (
    <ProductLandingPage
      locale="pt-PT"
      path={path}
      structuredName={META_TITLE}
      structuredDescription={t("meta.description")}
      eyebrow={t("eyebrow")}
      h1={t("h1")}
      intro={t("intro")}
      features={features}
      primaryCta={{
        href: BOOKING_PUBLIC_ORIGIN,
        label: t("primaryCta"),
        external: true,
      }}
      secondaryCta={{
        href: demoUrl,
        label: t("demoCta"),
        external: true,
      }}
    />
  );
}