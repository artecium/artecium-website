import { StartProjectButton } from "@/components/contact/StartProjectButton";
import { FaqStructuredData } from "@/components/faq/FaqStructuredData";
import { ServiceBreadcrumb } from "@/components/services/ServiceBreadcrumb";
import type { AppLocale } from "@/i18n/config";
import { intlLocale } from "@/i18n/config";
import { getFaqAlternateHref } from "@/lib/faq/metadata";
import { getFaqPath } from "@/lib/faq/paths";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import {
  getServicePath,
  getServicesHubPath,
  type ServicePageId,
} from "@/lib/services/paths";
import Link from "next/link";

const categoryKeys = ["websites", "ai", "seo", "projects"] as const;
type FaqCategoryKey = (typeof categoryKeys)[number];

const categoryServiceLinks: Partial<Record<FaqCategoryKey, ServicePageId>> = {
  websites: "websites",
  ai: "ia",
  seo: "seo",
};

interface FaqItemTranslation {
  question: string;
  answer: string;
  link?: {
    label: string;
    service: ServicePageId;
  };
}

interface FaqPageProps {
  locale: AppLocale;
}

export async function FaqPage({ locale }: FaqPageProps) {
  const t = await getTranslationsForLocale(locale, "faq");
  const tNav = await getTranslationsForLocale(locale, "legal.nav");
  const path = getFaqPath(locale);
  const hubPath = getServicesHubPath(locale);
  const homePath = locale === "en" ? "/en" : "/";

  const breadcrumbItems = [
    { label: t("breadcrumb.home"), href: homePath },
    { label: t("breadcrumb.current") },
  ];

  const schemaBreadcrumb = [
    { name: t("breadcrumb.home"), path: homePath },
    { name: t("breadcrumb.current"), path },
  ];

  const allFaqItems: Array<{ question: string; answer: string }> = [];

  for (const categoryKey of categoryKeys) {
    const items = t.raw(`categories.${categoryKey}.items`) as FaqItemTranslation[];
    for (const item of items) {
      allFaqItems.push({ question: item.question, answer: item.answer });
    }
  }

  return (
    <>
      <FaqStructuredData
        path={path}
        pageName={t("metadata.title")}
        pageDescription={t("metadata.description")}
        inLanguage={intlLocale(locale)}
        breadcrumbItems={schemaBreadcrumb}
        faqItems={allFaqItems}
      />

      <ServiceBreadcrumb
        items={breadcrumbItems}
        alternateHref={getFaqAlternateHref(locale)}
        alternateLabel={
          locale === "en" ? tNav("alternatePt") : tNav("alternateEn")
        }
        languageLabel={tNav("switchLanguage")}
      />

      <section
        aria-labelledby="faq-hero-heading"
        className="relative overflow-hidden px-6 pb-16 pt-12 sm:px-10 sm:pb-20 lg:px-16 lg:pt-16"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-1/4 top-0 h-[480px] w-[480px] rounded-full bg-[#2563EB]/[0.05] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <h1
            id="faq-hero-heading"
            className="text-[2.5rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl"
          >
            {t("hero.title")}
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[#94A3B8] sm:text-xl">
            {t("hero.description")}
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#64748B]">
            {t("hero.context")}
          </p>

          <div className="mt-10">
            <StartProjectButton className="w-full sm:w-auto">
              {t("hero.cta")}
            </StartProjectButton>
          </div>
        </div>
      </section>

      <div className="border-t border-[#1E293B]/60 px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
        <div className="mx-auto max-w-3xl space-y-16">
          {categoryKeys.map((categoryKey) => {
            const items = t.raw(
              `categories.${categoryKey}.items`,
            ) as FaqItemTranslation[];
            const serviceId = categoryServiceLinks[categoryKey];
            const categoryLinkLabel =
              categoryKey !== "projects"
                ? t(`categories.${categoryKey}.linkLabel`)
                : null;

            return (
              <section
                key={categoryKey}
                aria-labelledby={`faq-${categoryKey}-heading`}
              >
                <h2
                  id={`faq-${categoryKey}-heading`}
                  className="text-2xl font-semibold tracking-tight text-white sm:text-3xl"
                >
                  {t(`categories.${categoryKey}.title`)}
                </h2>

                <div className="mt-8 space-y-3">
                  {items.map((item) => (
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
                        <p>{item.answer}</p>
                        {item.link ? (
                          <p className="mt-3">
                            <Link
                              href={getServicePath(item.link.service, locale)}
                              className="font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                            >
                              {item.link.label}
                            </Link>
                          </p>
                        ) : null}
                      </div>
                    </details>
                  ))}
                </div>

                {categoryKey === "projects" ? (
                  <div className="mt-6 flex flex-wrap gap-4">
                    <Link
                      href={getServicePath("websites", locale)}
                      className="text-sm font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                    >
                      {t("categories.projects.links.websites")}
                    </Link>
                    <Link
                      href={getServicePath("ia", locale)}
                      className="text-sm font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                    >
                      {t("categories.projects.links.ai")}
                    </Link>
                    <Link
                      href={getServicePath("seo", locale)}
                      className="text-sm font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                    >
                      {t("categories.projects.links.seo")}
                    </Link>
                  </div>
                ) : null}

                {serviceId && categoryLinkLabel ? (
                  <p className="mt-6">
                    <Link
                      href={getServicePath(serviceId, locale)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                    >
                      {categoryLinkLabel}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                ) : categoryKey === "projects" ? (
                  <p className="mt-6">
                    <Link
                      href={hubPath}
                      className="inline-flex items-center gap-2 text-sm font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                    >
                      {t("categories.projects.hubLink")}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                ) : null}
              </section>
            );
          })}

          <p className="text-center">
            <Link
              href={hubPath}
              className="text-sm font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
            >
              {t("allServices")}
            </Link>
          </p>
        </div>
      </div>

      <section
        aria-labelledby="faq-cta-heading"
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
              id="faq-cta-heading"
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
