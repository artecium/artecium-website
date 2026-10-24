import { BlogHubStructuredData } from "@/components/blog/BlogHubStructuredData";
import { ServiceBreadcrumb } from "@/components/services/ServiceBreadcrumb";
import type { AppLocale } from "@/i18n/config";
import { intlLocale } from "@/i18n/config";
import { SITE_URL } from "@/config/seo";
import { getBlogHubAlternateHref } from "@/lib/blog/metadata";
import { getBlogArticlePath, getBlogHubPath } from "@/lib/blog/paths";
import { BLOG_ARTICLE_LIST } from "@/lib/blog/registry";
import type { BlogArticleId } from "@/lib/blog/types";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import Link from "next/link";

interface BlogHubPageProps {
  locale: AppLocale;
}

export async function BlogHubPage({ locale }: BlogHubPageProps) {
  const t = await getTranslationsForLocale(locale, "blog.hub");
  const tNav = await getTranslationsForLocale(locale, "legal.nav");
  const tBlog = await getTranslationsForLocale(locale, "blog.shared");

  const path = getBlogHubPath(locale);
  const homePath = locale === "en" ? "/en" : "/";

  const breadcrumbItems = [
    { label: tBlog("breadcrumb.home"), href: homePath },
    { label: tBlog("breadcrumb.blog") },
  ];

  const schemaBreadcrumb = [
    { name: tBlog("breadcrumb.home"), path: homePath },
    { name: tBlog("breadcrumb.blog"), path },
  ];

  const articles = BLOG_ARTICLE_LIST.map((article) => {
    const articleT = t.raw(`cards.${article.id}`) as {
      title: string;
      description: string;
    };

    return {
      id: article.id,
      path: getBlogArticlePath(article.id, locale),
      category: article.category,
      publishedAt: article.publishedAt,
      title: articleT.title,
      description: articleT.description,
    };
  });

  return (
    <>
      <BlogHubStructuredData
        path={path}
        name={t("metadata.title")}
        description={t("metadata.description")}
        inLanguage={intlLocale(locale)}
        breadcrumbItems={schemaBreadcrumb}
        articles={articles.map((article) => ({
          name: article.title,
          url: `${SITE_URL}${article.path}`,
          description: article.description,
        }))}
      />

      <ServiceBreadcrumb
        items={breadcrumbItems}
        alternateHref={getBlogHubAlternateHref(locale)}
        alternateLabel={
          locale === "en" ? tNav("alternatePt") : tNav("alternateEn")
        }
        languageLabel={tNav("switchLanguage")}
      />

      <div className="px-6 pb-16 pt-8 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <header className="mb-12 max-w-3xl">
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

          <div className="grid gap-6 sm:grid-cols-2">
            {articles.map((article) => (
              <article
                key={article.id}
                className="flex flex-col rounded-2xl border border-[#1E293B] bg-[#0E1324]/60 p-6 transition-colors hover:border-[#2563EB]/40"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-[#1E293B] px-3 py-1 text-xs font-medium uppercase tracking-wide text-[#64748B]">
                    {tBlog(`categories.${article.category}`)}
                  </span>
                  <time
                    dateTime={article.publishedAt}
                    className="text-xs text-[#64748B]"
                  >
                    {formatArticleDate(article.publishedAt, locale)}
                  </time>
                </div>
                <h2 className="text-xl font-semibold text-white">
                  <Link
                    href={article.path}
                    className="transition-colors hover:text-[#60A5FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                  >
                    {article.title}
                  </Link>
                </h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[#94A3B8]">
                  {article.description}
                </p>
                <Link
                  href={article.path}
                  className="mt-6 inline-flex text-sm font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                >
                  {t("readMore")}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function formatArticleDate(date: string, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export type { BlogArticleId };
