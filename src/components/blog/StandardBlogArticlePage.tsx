import { StartProjectButton } from "@/components/contact/StartProjectButton";
import { BlogArticleStructuredData } from "@/components/blog/BlogArticleStructuredData";
import { ServiceBreadcrumb } from "@/components/services/ServiceBreadcrumb";
import type { AppLocale } from "@/i18n/config";
import { intlLocale } from "@/i18n/config";
import {
  getBlogArticleAlternateHref,
} from "@/lib/blog/metadata";
import { resolveBlogLinkHref, type BlogRelatedLink } from "@/lib/blog/links";
import { getBlogArticlePath, getBlogHubPath } from "@/lib/blog/paths";
import { BLOG_ARTICLES } from "@/lib/blog/registry";
import type { BlogArticleId } from "@/lib/blog/types";
import { getServicePath } from "@/lib/services/paths";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import Link from "next/link";

interface FaqItem {
  question: string;
  answer: string;
}

interface PlanRow {
  name: string;
  price: string;
  description: string;
}

interface CardItem {
  title: string;
  description: string;
}

interface ComparisonRow {
  aspect: string;
  col1: string;
  col2: string;
}

type ArticleSection =
  | { type: "prose"; id?: string; title: string; paragraphs: string[] }
  | {
      type: "list";
      id?: string;
      title: string;
      intro?: string;
      items: string[];
    }
  | {
      type: "cards";
      id?: string;
      title: string;
      intro?: string;
      items: CardItem[];
    }
  | {
      type: "plans";
      id?: string;
      title: string;
      intro?: string;
      plans: PlanRow[];
      linkLabel?: string;
      linkHrefKey?: "seo" | "websites" | "ia";
    }
  | {
      type: "comparison";
      id?: string;
      title: string;
      intro?: string;
      headers: string[];
      rows: ComparisonRow[];
    };

interface StandardBlogArticlePageProps {
  articleId: BlogArticleId;
  locale: AppLocale;
}

export async function StandardBlogArticlePage({
  articleId,
  locale,
}: StandardBlogArticlePageProps) {
  const namespace = `blog.articles.${articleId}`;
  const t = await getTranslationsForLocale(locale, namespace);
  const tNav = await getTranslationsForLocale(locale, "legal.nav");
  const tBlog = await getTranslationsForLocale(locale, "blog.shared");

  const path = getBlogArticlePath(articleId, locale);
  const homePath = locale === "en" ? "/en" : "/";
  const blogHubPath = getBlogHubPath(locale);
  const article = BLOG_ARTICLES[articleId];

  const sections = t.raw("sections") as ArticleSection[];
  const faqItems = (t.has("faq.items")
    ? t.raw("faq.items")
    : []) as FaqItem[];
  const relatedLinks = t.raw("relatedLinks") as BlogRelatedLink[];

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
              {tBlog(`categories.${article.category}`)}
            </p>
            <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {t("hero.title")}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[#94A3B8]">
              {t("hero.intro")}
            </p>
          </header>

          <div className="space-y-12 text-[#94A3B8]">
            {sections.map((section, index) => (
              <ArticleSectionBlock
                key={`${section.type}-${section.title}-${index}`}
                section={section}
                locale={locale}
              />
            ))}

            {faqItems.length > 0 ? (
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
            ) : null}

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

function ArticleSectionBlock({
  section,
  locale,
}: {
  section: ArticleSection;
  locale: AppLocale;
}) {
  const headingId = section.id ?? `${section.type}-heading`;

  switch (section.type) {
    case "prose":
      return (
        <section aria-labelledby={headingId}>
          <h2 id={headingId} className="text-2xl font-semibold text-white">
            {section.title}
          </h2>
          <div className="mt-4 space-y-4 leading-relaxed">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      );

    case "list":
      return (
        <section aria-labelledby={headingId}>
          <h2 id={headingId} className="text-2xl font-semibold text-white">
            {section.title}
          </h2>
          {section.intro ? (
            <p className="mt-4 leading-relaxed">{section.intro}</p>
          ) : null}
          <ul className="mt-4 list-disc space-y-2 pl-5">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      );

    case "cards":
      return (
        <section aria-labelledby={headingId}>
          <h2 id={headingId} className="text-2xl font-semibold text-white">
            {section.title}
          </h2>
          {section.intro ? (
            <p className="mt-4 leading-relaxed">{section.intro}</p>
          ) : null}
          <div className="mt-6 space-y-4">
            {section.items.map((item) => (
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
      );

    case "plans":
      return (
        <section aria-labelledby={headingId}>
          <h2 id={headingId} className="text-2xl font-semibold text-white">
            {section.title}
          </h2>
          {section.intro ? (
            <p className="mt-4 leading-relaxed">{section.intro}</p>
          ) : null}
          <ul className="mt-6 space-y-3">
            {section.plans.map((plan) => (
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
          {section.linkLabel && section.linkHrefKey ? (
            <p className="mt-4">
              <Link
                href={getServicePath(section.linkHrefKey, locale)}
                className="font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
              >
                {section.linkLabel}
              </Link>
            </p>
          ) : null}
        </section>
      );

    case "comparison":
      return (
        <section aria-labelledby={headingId}>
          <h2 id={headingId} className="text-2xl font-semibold text-white">
            {section.title}
          </h2>
          {section.intro ? (
            <p className="mt-4 leading-relaxed">{section.intro}</p>
          ) : null}
          <div className="mt-6 overflow-x-auto rounded-xl border border-[#1E293B]">
            <table className="min-w-full divide-y divide-[#1E293B] text-left text-sm">
              <thead className="bg-[#0A0F1E]">
                <tr>
                  {section.headers.map((header) => (
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
                {section.rows.map((row) => (
                  <tr key={row.aspect} className="bg-[#0E1324]/60">
                    <td className="px-4 py-3 font-medium text-white">
                      {row.aspect}
                    </td>
                    <td className="px-4 py-3">{row.col1}</td>
                    <td className="px-4 py-3">{row.col2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
  }
}
