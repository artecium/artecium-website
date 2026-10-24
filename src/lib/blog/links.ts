import type { AppLocale } from "@/i18n/config";
import { getBlogArticlePath, getBlogHubPath } from "@/lib/blog/paths";
import type { BlogArticleId } from "@/lib/blog/types";
import { getFaqPath } from "@/lib/faq/paths";
import {
  getServicePath,
  getServicesHubPath,
} from "@/lib/services/paths";

export type BlogLinkHrefKey =
  | "blog"
  | "services"
  | "websites"
  | "ia"
  | "seo"
  | "faq";

export interface BlogRelatedLink {
  label: string;
  hrefKey?: BlogLinkHrefKey;
  articleId?: BlogArticleId;
}

export function resolveBlogLinkHref(
  link: BlogRelatedLink,
  locale: AppLocale,
): string {
  if (link.articleId) {
    return getBlogArticlePath(link.articleId, locale);
  }

  switch (link.hrefKey) {
    case "blog":
      return getBlogHubPath(locale);
    case "services":
      return getServicesHubPath(locale);
    case "websites":
      return getServicePath("websites", locale);
    case "ia":
      return getServicePath("ia", locale);
    case "seo":
      return getServicePath("seo", locale);
    case "faq":
      return getFaqPath(locale);
    default:
      return getServicesHubPath(locale);
  }
}
