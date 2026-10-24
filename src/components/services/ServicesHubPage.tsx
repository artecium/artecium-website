import { StartProjectButton } from "@/components/contact/StartProjectButton";
import { ServiceBreadcrumb } from "@/components/services/ServiceBreadcrumb";
import { ServicesHubStructuredData } from "@/components/services/ServicesHubStructuredData";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { AppLocale } from "@/i18n/config";
import { intlLocale } from "@/i18n/config";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import {
  getServicesHubAlternateHref,
} from "@/lib/services/metadata";
import { getServicePath, getServicesHubPath } from "@/lib/services/paths";
import Link from "next/link";

const hubServiceKeys = ["websites", "ia", "seo"] as const;
const guideKeys = ["websites", "ia", "seo"] as const;

interface ServicesHubPageProps {
  locale: AppLocale;
}

export async function ServicesHubPage({ locale }: ServicesHubPageProps) {
  const t = await getTranslationsForLocale(locale, "services.hub");
  const tNav = await getTranslationsForLocale(locale, "legal.nav");
  const path = getServicesHubPath(locale);

  const breadcrumbItems = [
    { label: t("breadcrumb.home"), href: "/" },
    { label: t("breadcrumb.current") },
  ];

  const schemaBreadcrumb = [
    { name: t("breadcrumb.home"), path: "/" },
    { name: t("breadcrumb.current"), path },
  ];

  const schemaServices = hubServiceKeys.map((key) => ({
    name: t(`cards.${key}.title`),
    path: getServicePath(key, locale),
    description: t(`cards.${key}.description`),
  }));

  return (
    <>
      <ServicesHubStructuredData
        path={path}
        pageName={t("metadata.title")}
        pageDescription={t("metadata.description")}
        inLanguage={intlLocale(locale)}
        breadcrumbItems={schemaBreadcrumb}
        services={schemaServices}
      />

      <ServiceBreadcrumb
        items={breadcrumbItems}
        alternateHref={getServicesHubAlternateHref(locale)}
        alternateLabel={
          locale === "en" ? tNav("alternatePt") : tNav("alternateEn")
        }
        languageLabel={tNav("switchLanguage")}
      />

      <section
        aria-labelledby="services-hub-hero-heading"
        className="relative overflow-hidden px-6 pb-16 pt-12 sm:px-10 sm:pb-20 lg:px-16 lg:pt-16"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-1/4 top-0 h-[480px] w-[480px] rounded-full bg-[#2563EB]/[0.05] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="mb-6 inline-flex items-center rounded-full border border-[#1E293B] bg-[#0E1324]/80 px-4 py-2 text-sm text-[#94A3B8] backdrop-blur-sm">
            {t("hero.geoNote")}
          </p>

          <h1
            id="services-hub-hero-heading"
            className="text-[2.5rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl"
          >
            {t("hero.title")}
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[#94A3B8] sm:text-xl">
            {t("hero.description")}
          </p>

          <div className="mt-10">
            <StartProjectButton className="w-full sm:w-auto">
              {t("hero.cta")}
            </StartProjectButton>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="services-hub-cards-heading"
        className="border-t border-[#1E293B]/60 bg-[#0E1324]/20 px-6 py-20 sm:px-10 lg:px-16"
      >
        <div className="mx-auto max-w-7xl">
          <h2 id="services-hub-cards-heading" className="sr-only">
            {t("breadcrumb.current")}
          </h2>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {hubServiceKeys.map((key) => (
              <article
                key={key}
                className="group flex h-full flex-col rounded-2xl border border-[#1E293B] bg-[#0E1324]/80 p-8 transition-all duration-300 hover:border-[#2563EB]/30 hover:shadow-[0_8px_40px_rgba(37,99,235,0.08)]"
              >
                <h3 className="text-lg font-semibold text-white">
                  {t(`cards.${key}.title`)}
                </h3>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-[#94A3B8]">
                  {t(`cards.${key}.description`)}
                </p>
                <Link
                  href={getServicePath(key, locale)}
                  className="mt-8 inline-flex h-11 items-center justify-center rounded-full border border-[#1E293B] bg-[#050816] px-6 text-sm font-medium text-white transition-all duration-300 hover:border-[#334155] hover:bg-[#0E1324] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                >
                  {t(`cards.${key}.cta`)}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="services-hub-guide-heading"
        className="px-6 py-20 sm:px-10 lg:px-16"
      >
        <div className="mx-auto max-w-5xl">
          <SectionHeader
            title={t("guide.title")}
            titleId="services-hub-guide-heading"
          />

          <div className="mt-12 space-y-4">
            {guideKeys.map((key) => (
              <article
                key={key}
                className="flex flex-col gap-4 rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-base text-[#94A3B8]">
                  {t(`guide.paths.${key}.question`)}
                </p>
                <Link
                  href={getServicePath(key, locale)}
                  className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                >
                  {t(`guide.paths.${key}.linkLabel`)}
                  <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="services-hub-cta-heading"
        className="border-t border-[#1E293B]/60 px-6 py-20 sm:px-10 lg:px-16"
      >
        <div className="relative mx-auto max-w-4xl text-center">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            <div className="absolute left-1/2 top-1/2 h-[360px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2563EB]/[0.06] blur-[100px]" />
          </div>

          <div className="relative">
            <h2
              id="services-hub-cta-heading"
              className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
              {t("cta.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#94A3B8] sm:text-lg">
              {t("cta.description")}
            </p>
            <div className="mt-8">
              <StartProjectButton className="w-full sm:w-auto">
                {t("cta.button")}
              </StartProjectButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
