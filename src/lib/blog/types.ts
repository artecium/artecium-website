import type { AppLocale } from "@/i18n/config";

export const BLOG_ARTICLE_IDS = {
  websiteCostPortugal2026: "websiteCostPortugal2026",
  seoCostPortugal2026: "seoCostPortugal2026",
  professionalVsCheapWebsite: "professionalVsCheapWebsite",
  whatIsSeo: "whatIsSeo",
  websiteVsWebApp: "websiteVsWebApp",
  aiPoweredWebsite: "aiPoweredWebsite",
} as const;

export type BlogArticleId =
  (typeof BLOG_ARTICLE_IDS)[keyof typeof BLOG_ARTICLE_IDS];

export type BlogArticleCategory = "websites" | "seo" | "ia";

export interface BlogArticleDefinition {
  id: BlogArticleId;
  slugs: Record<AppLocale, string>;
  publishedAt: string;
  category: BlogArticleCategory;
}

export const BLOG_ARTICLE_IDS_LIST = Object.values(
  BLOG_ARTICLE_IDS,
) as BlogArticleId[];
