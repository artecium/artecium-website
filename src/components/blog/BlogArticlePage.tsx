import { StartProjectButton } from "@/components/contact/StartProjectButton";
import { BlogArticleStructuredData } from "@/components/blog/BlogArticleStructuredData";
import { ServiceBreadcrumb } from "@/components/services/ServiceBreadcrumb";
import type { AppLocale } from "@/i18n/config";
import { intlLocale } from "@/i18n/config";
import { getBlogArticleAlternateHref } from "@/lib/blog/metadata";
import { resolveBlogLinkHref, type BlogRelatedLink } from "@/lib/blog/links";
import { getBlogArticlePath, getBlogHubPath } from "@/lib/blog/paths";
import { BLOG_ARTICLES } from "@/lib/blog/registry";
import type { BlogArticleId } from "@/lib/blog/types";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import { getServicePath } from "@/lib/services/paths";
import Link from "next/link";

interface FaqItem {
  question: string;
  answer: string;
}

interface PriceTableRow {
  type: string;
  includes: string;
  note: string;
}

interface PlanRow {
  name: string;
  price: string;
  description: string;
}

interface BlogArticlePageProps {
  articleId: BlogArticleId;
  locale: AppLocale;
}

export async function BlogArticlePage({ articleId, locale }: BlogArticlePageProps) {
  const namespace = `blog.articles.${articleId}`;
  const t = await getTranslationsForLocale(locale, namespace);
  const tNav = await getTranslationsForLocale(locale, "legal.nav");
  const tBlog = await getTranslationsForLocale(locale, "blog.shared");

  const path = getBlogArticlePath(articleId, locale);
  const homePath = locale === "en" ? "/en" : "/";
  const blogHubPath = getBlogHubPath(locale);
  const article = BLOG_ARTICLES[articleId];

  const breadcrumbItems = [
    { label: tBlog("breadcrumb.home"), href: homePath },
    { label: tBlog("breadcrumb.blog"), href: blogHubPath },
    { label: t("breadcrumb.current") },
  ];

  const schemaBreadcrumb = [
    { name: tBlog("breadcrumb.home"), path: homePath },
    { name: tBlog("breadcrumb.blog"), path: blogHubPath },
    { name: t("breadcrumb.current"), path },
  ];

  const faqItems = t.raw("faq.items") as FaqItem[];
  const priceTableRows = t.raw("priceTable.rows") as PriceTableRow[];
  const priceFactors = t.raw("priceFactors.items") as Array<{
    title: string;
    description: string;
  }>;
  const arteciumPlans = t.raw("arteciumPricing.plans") as PlanRow[];
  const seoPlans = t.raw("seoPricing.plans") as PlanRow[];
  const relatedLinks = t.raw("relatedLinks") as BlogRelatedLink[];

  return (
    <>
      <BlogArticleStructuredData
        path={path}
        headline={t("hero.title")}
        description={t("metadata.description")}
        inLanguage={intlLocale(locale)}
        datePublished={article.publishedAt}
        breadcrumbItems={schemaBreadcrumb}
        faqItems={faqItems}
      />

      <ServiceBreadcrumb
        items={breadcrumbItems}
        alternateHref={getBlogArticleAlternateHref(articleId, locale)}
        alternateLabel={
          locale === "en" ? tNav("alternatePt") : tNav("alternateEn")
        }
        languageLabel={tNav("switchLanguage")}
      />

      <article className="px-6 pb-16 pt-8 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl">
          <header className="mb-12">
            <p className="mb-4 text-sm font-medium tracking-widest text-[#64748B] uppercase">
              {tBlog("label")}
            </p>
            <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {t("hero.title")}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[#94A3B8]">
              {t("hero.intro")}
            </p>
          </header>

          <div className="space-y-12 text-[#94A3B8]">
            <section aria-labelledby="average-cost-heading">
              <h2
                id="average-cost-heading"
                className="text-2xl font-semibold text-white"
              >
                {t("averageCost.title")}
              </h2>
              <p className="mt-4 leading-relaxed">{t("averageCost.paragraph")}</p>
              <ul className="mt-4 list-disc space-y-2 pl-5">
                {(t.raw("averageCost.factors") as string[]).map((factor) => (
                  <li key={factor}>{factor}</li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="price-table-heading">
              <h2
                id="price-table-heading"
                className="text-2xl font-semibold text-white"
              >
                {t("priceTable.title")}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#64748B]">
                {t("priceTable.disclaimer")}
              </p>
              <div className="mt-6 overflow-x-auto rounded-xl border border-[#1E293B]">
                <table className="min-w-full divide-y divide-[#1E293B] text-left text-sm">
                  <thead className="bg-[#0A0F1E]">
                    <tr>
                      {(t.raw("priceTable.headers") as string[]).map((header) => (
                        <th
                          key={header}
                          scope="col"
                          className="px-4 py-3 font-medium text-white"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]">
                    {priceTableRows.map((row) => (
                      <tr key={row.type} className="bg-[#0E1324]/60">
                        <td className="px-4 py-3 font-medium text-white">
                          {row.type}
                        </td>
                        <td className="px-4 py-3">{row.includes}</td>
                        <td className="px-4 py-3 text-[#64748B]">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="price-factors-heading">
              <h2
                id="price-factors-heading"
                className="text-2xl font-semibold text-white"
              >
                {t("priceFactors.title")}
              </h2>
              <div className="mt-6 space-y-4">
                {priceFactors.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-[#1E293B] bg-[#0E1324]/60 p-5"
                  >
                    <h3 className="font-medium text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <ProseSection
              id="institutional-heading"
              title={t("institutional.title")}
              paragraphs={t.raw("institutional.paragraphs") as string[]}
            />

            <ProseSection
              id="professional-heading"
              title={t("professional.title")}
              paragraphs={t.raw("professional.paragraphs") as string[]}
            />

            <ProseSection
              id="webapp-heading"
              title={t("webApp.title")}
              paragraphs={t.raw("webApp.paragraphs") as string[]}
            />

            <ProseSection
              id="domain-hosting-heading"
              title={t("domainHosting.title")}
              paragraphs={t.raw("domainHosting.paragraphs") as string[]}
            />

            <ProseSection
              id="maintenance-heading"
              title={t("maintenance.title")}
              paragraphs={t.raw("maintenance.paragraphs") as string[]}
            />

            <section aria-labelledby="seo-pricing-heading">
              <h2
                id="seo-pricing-heading"
                className="text-2xl font-semibold text-white"
              >
                {t("seoPricing.title")}
              </h2>
              <p className="mt-4 leading-relaxed">{t("seoPricing.intro")}</p>
              <ul className="mt-6 space-y-3">
                {seoPlans.map((plan) => (
                  <li
                    key={plan.name}
                    className="rounded-xl border border-[#1E293B] bg-[#0E1324]/60 p-5"
                  >
                    <p className="font-medium text-white">
                      {plan.name} — {plan.price}
                    </p>
                    <p className="mt-2 text-sm">{plan.description}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-4">
                <Link
                  href={getServicePath("seo", locale)}
                  className="font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                >
                  {t("seoPricing.linkLabel")}
                </Link>
              </p>
            </section>

            <section aria-labelledby="artecium-pricing-heading">
              <h2
                id="artecium-pricing-heading"
                className="text-2xl font-semibold text-white"
              >
                {t("arteciumPricing.title")}
              </h2>
              <p className="mt-4 leading-relaxed">{t("arteciumPricing.intro")}</p>
              <ul className="mt-6 space-y-3">
                {arteciumPlans.map((plan) => (
                  <li
                    key={plan.name}
                    className="rounded-xl border border-[#1E293B] bg-[#0E1324]/60 p-5"
                  >
                    <p className="font-medium text-white">
                      {plan.name} — {plan.price}
                    </p>
                    <p className="mt-2 text-sm">{plan.description}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-4">
                <Link
                  href={getServicePath("websites", locale)}
                  className="font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                >
                  {t("arteciumPricing.linkLabel")}
                </Link>
              </p>
            </section>

            <section aria-labelledby="article-faq-heading">
              <h2
                id="article-faq-heading"
                className="text-2xl font-semibold text-white"
              >
                {t("faq.title")}
              </h2>
              <div className="mt-6 space-y-3">
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
                    <div className="border-t border-[#1E293B]/80 px-5 py-4 text-sm leading-relaxed">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>

            <section aria-labelledby="related-links-heading">
              <h2
                id="related-links-heading"
                className="text-lg font-semibold text-white"
              >
                {t("relatedLinksTitle")}
              </h2>
              <ul className="mt-4 flex flex-wrap gap-4">
                {relatedLinks.map((link) => (
                  <li key={`${link.label}-${link.hrefKey ?? link.articleId}`}>
                    <Link
                      href={resolveBlogLinkHref(link, locale)}
                      className="text-sm font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section
            aria-labelledby="article-cta-heading"
            className="mt-16 rounded-2xl border border-[#1E293B] bg-[#0E1324]/80 p-8 text-center"
          >
            <h2
              id="article-cta-heading"
              className="text-2xl font-semibold text-white"
            >
              {t("cta.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[#94A3B8]">
              {t("cta.description")}
            </p>
            <div className="mt-8">
              <StartProjectButton className="w-full sm:w-auto">
                {t("cta.button")}
              </StartProjectButton>
            </div>
          </section>
        </div>
      </article>
    </>
  );
}

function ProseSection({
  id,
  title,
  paragraphs,
}: {
  id: string;
  title: string;
  paragraphs: string[];
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-2xl font-semibold text-white">
        {title}
      </h2>
      <div className="mt-4 space-y-4 leading-relaxed">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
