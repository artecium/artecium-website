import { getBookingMarketingPath, getClientAreaLandingPath } from "@/lib/product-landing/paths";
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
      className="border-y border-[#1E293B]/60 bg-[#0A0F1F]"
    >
      <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:px-16">
        <h2
          id="product-entry-heading"
          className="text-center text-2xl font-semibold text-white sm:text-3xl"
        >
          {t("heading")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-[#94A3B8] sm:text-base">
          {t("subheading")}
        </p>
        <h4 className="sr-only">{t("srNav")}</h4>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Link
            href={clientPath}
            className="group rounded-2xl border border-[#1E293B] bg-[#050816] p-8 transition-colors hover:border-[#2563EB]/50"
          >
            <h3 className="text-lg font-medium text-white">{t("clientTitle")}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#94A3B8]">
              {t("clientDescription")}
            </p>
            <span className="mt-6 inline-block text-sm font-medium text-[#2563EB] group-hover:underline">
              {t("clientCta")}
            </span>
          </Link>
          <Link
            href={bookingPath}
            className="group rounded-2xl border border-[#1E293B] bg-[#050816] p-8 transition-colors hover:border-[#2563EB]/50"
          >
            <h3 className="text-lg font-medium text-white">{t("bookingTitle")}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#94A3B8]">
              {t("bookingDescription")}
            </p>
            <span className="mt-6 inline-block text-sm font-medium text-[#2563EB] group-hover:underline">
              {t("bookingCta")}
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}