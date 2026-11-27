import { StartProjectButton } from "@/components/contact/StartProjectButton";
import { ServiceBreadcrumb } from "@/components/services/ServiceBreadcrumb";
import { ServiceCrossLinks } from "@/components/services/ServiceCrossLinks";
import { ServiceStructuredData } from "@/components/services/ServiceStructuredData";
import { WebsitesPlanCard } from "@/components/services/websites/WebsitesPlanCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { AppLocale } from "@/i18n/config";
import { intlLocale } from "@/i18n/config";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import { getCommercialPlanDisplay } from "@/lib/pricing/display";
import { getServiceAlternateHref } from "@/lib/services/metadata";
import { getServicePath, getServicesHubPath } from "@/lib/services/paths";
import Link from "next/link";

const problemKeys = [
  "lowVisibility",
  "unstructuredContent",
  "technicalIssues",
  "noFollowUp",
] as const;

const workKeys = [
  "audit",
  "technicalSeo",
  "keywordResearch",
  "metadata",
  "headings",
  "contentStructure",
  "internalLinking",
  "sitemapIndexing",
  "searchConsole",
  "localSeo",
  "competitorAnalysis",
  "searchContent",
  "geoAiSearch",
  "monitoringOptimization",
] as const;

const geoPillarKeys = [
  "clearContent",
  "semanticStructure",
  "authorityConsistency",
] as const;

const planKeys = ["foundation", "growth", "advanced"] as const;
const processKeys = ["audit", "define", "optimize", "monitor"] as const;

interface SeoServicePageProps {
  locale: AppLocale;
}

export async function SeoServicePage({ locale }: SeoServicePageProps) {
  const t = await getTranslationsForLocale(locale, "services.seo");
  const tNav = await getTranslationsForLocale(locale, "legal.nav");
  const path = getServicePath("seo", locale);
  const hubPath = getServicesHubPath(locale);

  const faqItems = t.raw("faq.items") as Array<{
    question: string;
    answer: string;
  }>;
  const metrics = t.raw("metrics.items") as string[];

  const breadcrumbItems = [
    { label: t("breadcrumb.home"), href: "/" },
    { label: t("breadcrumb.services"), href: hubPath },
    { label: t("breadcrumb.current") },
  ];

  const schemaBreadcrumb = [
    { name: t("breadcrumb.home"), path: "/" },
    { name: t("breadcrumb.services"), path: hubPath },
    { name: t("breadcrumb.current"), path },
  ];

  return (
    <>
      <ServiceStructuredData
        path={path}
        pageName={t("metadata.title")}
        pageDescription={t("metadata.description")}
        serviceName={t("schema.serviceName")}
        serviceDescription={t("schema.serviceDescription")}
        inLanguage={intlLocale(locale)}
        breadcrumbItems={schemaBreadcrumb}
        faqItems={faqItems}
      />

      <ServiceBreadcrumb
        items={breadcrumbItems}
        alternateHref={getServiceAlternateHref("seo", locale)}
        alternateLabel={
          locale === "en" ? tNav("alternatePt") : tNav("alternateEn")
        }
        languageLabel={tNav("switchLanguage")}
      />

      <section
        aria-labelledby="seo-hero-heading"
        className="relative overflow-hidden px-6 pb-16 pt-12 sm:px-10 sm:pb-20 lg:px-16 lg:pt-16"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-1/4 top-0 h-[480px] w-[480px] rounded-full bg-[#10B981]/[0.04] blur-[120px]" />
          <div className="absolute -left-1/4 top-1/3 h-[360px] w-[360px] rounded-full bg-[#2563EB]/[0.05] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="mb-6 inline-flex items-center rounded-full border border-[#1E293B] bg-[#0E1324]/80 px-4 py-2 text-sm text-[#94A3B8] backdrop-blur-sm">
            {t("hero.geoNote")}
          </p>

          <h1
            id="seo-hero-heading"
            className="text-[2.5rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl"
          >
            {t("hero.title")}
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[#94A3B8] sm:text-xl">
            {t("hero.description")}
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#64748B] sm:text-base">
            {t("hero.tagline")}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <StartProjectButton className="w-full sm:w-auto">
              {t("hero.ctaPrimary")}
            </StartProjectButton>
            <Link
              href="#pricing"
              className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#1E293B] bg-[#0E1324] px-8 text-[0.9375rem] font-medium text-white transition-all duration-300 hover:border-[#334155] hover:bg-[#0E1324]/80 sm:w-auto"
            >
              {t("hero.ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="seo-problems-heading"
        className="border-t border-[#1E293B]/60 bg-[#0E1324]/20 px-6 py-20 sm:px-10 lg:px-16"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title={t("problems.title")}
            titleId="seo-problems-heading"
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {problemKeys.map((key) => (
              <article
                key={key}
                className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6 transition-colors duration-300 hover:border-[#2563EB]/25"
              >
                <h3 className="text-base font-semibold text-white">
                  {t(`problems.items.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
                  {t(`problems.items.${key}.description`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="seo-work-heading"
        className="px-6 py-20 sm:px-10 lg:px-16"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title={t("work.title")}
            description={t("work.intro")}
            titleId="seo-work-heading"
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {workKeys.map((key) => (
              <article
                key={key}
                className="rounded-2xl border border-[#1E293B] bg-[#0E1324]/60 p-6 transition-colors duration-300 hover:border-[#2563EB]/25"
              >
                <h3 className="text-base font-semibold text-white">
                  {t(`work.items.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
                  {t(`work.items.${key}.description`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="seo-geo-heading"
        className="border-y border-[#1E293B]/60 bg-[#050816] px-6 py-20 sm:px-10 lg:px-16"
      >
        <div className="mx-auto max-w-5xl">
          <SectionHeader
            title={t("geo.title")}
            description={t("geo.description")}
            titleId="seo-geo-heading"
          />

          <ol className="mt-12 grid gap-5 sm:grid-cols-3">
            {geoPillarKeys.map((key, index) => (
              <li
                key={key}
                className="rounded-2xl border border-[#1E293B] bg-[#0E1324]/80 p-6"
              >
                <p className="text-sm font-medium tracking-widest text-[#10B981] uppercase">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-base font-semibold text-white">
                  {t(`geo.pillars.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
                  {t(`geo.pillars.${key}.description`)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="pricing"
        aria-labelledby="seo-pricing-heading"
        className="px-6 py-20 sm:px-10 lg:px-16"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title={t("pricing.title")}
            titleId="seo-pricing-heading"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {planKeys.map((planKey) => {
              const display = getCommercialPlanDisplay(locale, "seo", planKey);
              return (
              <WebsitesPlanCard
                key={planKey}
                name={t(`pricing.plans.${planKey}.name`)}
                price={display.headline}
                subline={
                  planKey !== "foundation" ? display.subline ?? undefined : undefined
                }
                priceNote={
                  planKey === "foundation"
                    ? t(`pricing.plans.${planKey}.priceNote`)
                    : undefined
                }
                description={t(`pricing.plans.${planKey}.description`)}
                features={
                  t.raw(`pricing.plans.${planKey}.features`) as string[]
                }
                cta={t(`pricing.plans.${planKey}.cta`)}
                featured={planKey === "growth"}
                badge={
                  planKey === "foundation"
                    ? t("pricing.setupBadge")
                    : undefined
                }
                popularBadge={
                  planKey === "growth" ? t("pricing.popularBadge") : undefined
                }
              />
            );
            })}
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-[#64748B]">
            {t("pricing.note")}
          </p>
        </div>
      </section>

      <section
        aria-labelledby="seo-process-heading"
        className="border-t border-[#1E293B]/60 bg-[#0E1324]/20 px-6 py-20 sm:px-10 lg:px-16"
      >
        <div className="mx-auto max-w-5xl">
          <SectionHeader
            title={t("process.title")}
            titleId="seo-process-heading"
          />

          <ol className="mt-12 grid gap-5 sm:grid-cols-2">
            {processKeys.map((key, index) => (
              <li
                key={key}
                className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6"
              >
                <p className="text-sm font-medium tracking-widest text-[#2563EB] uppercase">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {t(`process.steps.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
                  {t(`process.steps.${key}.description`)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        aria-labelledby="seo-metrics-heading"
        className="px-6 py-20 sm:px-10 lg:px-16"
      >
        <div className="mx-auto max-w-5xl">
          <SectionHeader
            title={t("metrics.title")}
            description={t("metrics.intro")}
            titleId="seo-metrics-heading"
          />

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <li
                key={metric}
                className="rounded-xl border border-[#1E293B] bg-[#0E1324]/60 px-5 py-4 text-sm text-[#94A3B8]"
              >
                {metric}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        aria-labelledby="seo-faq-heading"
        className="border-t border-[#1E293B]/60 bg-[#0E1324]/20 px-6 py-20 sm:px-10 lg:px-16"
      >
        <div className="mx-auto max-w-3xl">
          <SectionHeader title={t("faq.title")} titleId="seo-faq-heading" />

          <div className="mt-10 space-y-3">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border border-[#1E293B] bg-[#0E1324] open:border-[#2563EB]/30"
              >
                <summary className="cursor-pointer list-none px-5 py-4 text-base font-medium text-white marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {item.question}
                    <span
                      className="text-[#64748B] transition-transform duration-200 group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <div className="border-t border-[#1E293B]/80 px-5 py-4 text-sm leading-relaxed text-[#94A3B8]">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <ServiceCrossLinks locale={locale} current="seo" />

      <section
        aria-labelledby="seo-cta-heading"
        className="border-t border-[#1E293B]/60 px-6 py-20 sm:px-10 lg:px-16"
      >
        <div className="relative mx-auto max-w-4xl text-center">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            <div className="absolute left-1/2 top-1/2 h-[360px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#10B981]/[0.05] blur-[100px]" />
          </div>

          <div className="relative">
            <h2
              id="seo-cta-heading"
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
