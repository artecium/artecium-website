"use client";

import { ClientDashboardBrowserFrame } from "@/components/home/client-dashboard-preview";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { marketing } from "@/lib/ui/marketing-classes";
import { getClientAreaLandingPath } from "@/lib/product-landing/paths";
import { resolveLocale } from "@/i18n/config";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export function ClientAreaShowcase() {
  const t = useTranslations("home.clientArea");
  const locale = resolveLocale(useLocale());
  const clientAreaLandingHref = getClientAreaLandingPath(locale);

  return (
    <section
      id="client-area"
      aria-labelledby="client-area-heading"
      className={`overflow-x-clip ${marketing.section} ${marketing.sectionDivider}`}
    >
      <ContainerScroll
        titleComponent={
          <div className="text-center">
            <p className={`mb-4 ${marketing.eyebrow}`}>{t("eyebrow")}</p>
            <h2 id="client-area-heading" className={marketing.titleLg}>
              {t("title")}
              <br />
              {t("titleLine2")}
            </h2>
            <p className={`mx-auto mt-4 max-w-2xl ${marketing.body}`}>{t("description")}</p>
            <Link href={clientAreaLandingHref} className={`mt-8 ${marketing.btnSecondary}`}>
              {t("exploreClientArea")}
            </Link>
          </div>
        }
      >
        <ClientDashboardBrowserFrame />
      </ContainerScroll>
    </section>
  );
}