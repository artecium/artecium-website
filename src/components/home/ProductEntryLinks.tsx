import { ProductPlatformsShowcase } from "@/components/home/ProductPlatformsShowcase";
import { getBookingMarketingPath, getClientAreaLandingPath } from "@/lib/product-landing/paths";
import type { AppLocale } from "@/i18n/config";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";

interface ProductEntryLinksProps {
  locale: AppLocale;
}

export async function ProductEntryLinks({ locale }: ProductEntryLinksProps) {
  const t = await getTranslationsForLocale(locale, "productLanding.entryStrip");
  const clientPath = getClientAreaLandingPath(locale);
  const bookingPath = getBookingMarketingPath(locale);

  return (
    <ProductPlatformsShowcase
      eyebrow={t("eyebrow")}
      heading={t("heading")}
      subheading={t("subheading")}
      srNav={t("srNav")}
      titleId="product-entry-heading"
      clientHref={clientPath}
      bookingHref={bookingPath}
      clientTitle={t("clientTitle")}
      clientDescription={t("clientDescription")}
      clientCta={t("clientCta")}
      bookingTitle={t("bookingTitle")}
      bookingDescription={t("bookingDescription")}
      bookingCta={t("bookingCta")}
    />
  );
}