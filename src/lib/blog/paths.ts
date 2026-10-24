import { BLOG_ARTICLES } from "@/lib/blog/registry";
import type { BlogArticleId } from "@/lib/blog/types";
import type { AppLocale } from "@/i18n/config";

export function getBlogHubPath(locale: AppLocale): string {
  return locale === "en" ? "/en/blog" : "/blog";
}

export function getAlternateBlogHubPath(currentLocale: AppLocale): string {
  const alternateLocale: AppLocale = currentLocale === "en" ? "pt-PT" : "en";
  return getBlogHubPath(alternateLocale);
}

export function getBlogArticlePath(
  articleId: BlogArticleId,
  locale: AppLocale,
): string {
  const article = BLOG_ARTICLES[articleId];
  const slug = article.slugs[locale];
  return locale === "en" ? `/en/blog/${slug}` : `/blog/${slug}`;
}

export function getAlternateBlogArticlePath(
  articleId: BlogArticleId,
  currentLocale: AppLocale,
): string {
  const alternateLocale: AppLocale = currentLocale === "en" ? "pt-PT" : "en";
  return getBlogArticlePath(articleId, alternateLocale);
}
