import type { AppLocale } from "@/i18n/config";
import { SITE_NAME } from "@/config/seo";
import type { BlogArticleId } from "@/lib/blog/types";
import {
  getAlternateBlogArticlePath,
  getAlternateBlogHubPath,
  getBlogArticlePath,
  getBlogHubPath,
} from "@/lib/blog/paths";
import { buildAlternateLanguages } from "@/lib/seo/hreflang";
import { constructMetadata } from "@/lib/seo/metadata";

interface BlogMetadataInput {
  title: string;
  description: string;
}

function withAbsoluteTitle(title: string) {
  return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
}

export function buildBlogHubMetadata(locale: AppLocale, meta: BlogMetadataInput) {
  const path = getBlogHubPath(locale);
  const fullTitle = withAbsoluteTitle(meta.title);

  return {
    ...constructMetadata({
      title: fullTitle,
      description: meta.description,
      path,
      openGraphLocale: locale === "en" ? "en_US" : "pt_PT",
      alternateLanguages: buildAlternateLanguages(
        getBlogHubPath("pt-PT"),
        getBlogHubPath("en"),
      ),
    }),
    title: { absolute: fullTitle },
  };
}

export function buildBlogArticleMetadata(
  articleId: BlogArticleId,
  locale: AppLocale,
  meta: BlogMetadataInput,
) {
  const path = getBlogArticlePath(articleId, locale);
  const fullTitle = withAbsoluteTitle(meta.title);

  return {
    ...constructMetadata({
      title: fullTitle,
      description: meta.description,
      path,
      openGraphLocale: locale === "en" ? "en_US" : "pt_PT",
      alternateLanguages: buildAlternateLanguages(
        getBlogArticlePath(articleId, "pt-PT"),
        getBlogArticlePath(articleId, "en"),
      ),
    }),
    title: { absolute: fullTitle },
  };
}

export function getBlogHubAlternateHref(locale: AppLocale): string {
  return getAlternateBlogHubPath(locale);
}

export function getBlogArticleAlternateHref(
  articleId: BlogArticleId,
  locale: AppLocale,
): string {
  return getAlternateBlogArticlePath(articleId, locale);
}
