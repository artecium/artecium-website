import { getBookingMarketingPath, getClientAreaLandingPath } from "@/lib/product-landing/paths";
import { marketing } from "@/lib/ui/marketing-classes";
import type { AppLocale } from "@/i18n/config";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import Link from "next/link";

interface ProductEntryLinksProps {
  locale: AppLocale;
}

export async function ProductEntryLinks({ locale }: ProductEntryLinksProps) {
  const t = await getTranslationsForLocale(locale, "productLanding.entryStrip");
  const clientPath = getClientAreaLandingPath(locale);
  const bookingPath = getBookingMarketingPath(locale);

  return (
    <section
      aria-labelledby="product-entry-heading"
      className={`${marketing.section} ${marketing.sectionDivider} ${marketing.sectionAlt}`}
    >
      <div className="mx-auto max-w-7xl">
        <h2 id="product-entry-heading" className={`text-center ${marketing.titleMd}`}>
          {t("heading")}
        </h2>
        <p className={`mx-auto mt-3 max-w-2xl text-center ${marketing.bodySm}`}>
          {t("subheading")}
        </p>
        <h3 className="sr-only">{t("srNav")}</h3>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <Link href={clientPath} className={marketing.cardInteractive}>
            <h3 className="text-lg font-medium text-foreground">{t("clientTitle")}</h3>
            <p className={`mt-3 ${marketing.bodySm}`}>{t("clientDescription")}</p>
            <span className={`mt-6 inline-block ${marketing.link}`}>{t("clientCta")}</span>
          </Link>
          <Link href={bookingPath} className={marketing.cardInteractive}>
            <h3 className="text-lg font-medium text-foreground">{t("bookingTitle")}</h3>
            <p className={`mt-3 ${marketing.bodySm}`}>{t("bookingDescription")}</p>
            <span className={`mt-6 inline-block ${marketing.link}`}>{t("bookingCta")}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}