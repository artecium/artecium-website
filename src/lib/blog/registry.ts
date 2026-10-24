import { BLOG_ARTICLE_IDS, type BlogArticleDefinition } from "@/lib/blog/types";

export const BLOG_ARTICLES: Record<
  BlogArticleDefinition["id"],
  BlogArticleDefinition
> = {
  [BLOG_ARTICLE_IDS.websiteCostPortugal2026]: {
    id: BLOG_ARTICLE_IDS.websiteCostPortugal2026,
    slugs: {
      "pt-PT": "quanto-custa-criar-um-website-em-portugal",
      en: "how-much-does-a-website-cost-in-portugal",
    },
    publishedAt: "2026-09-26",
    category: "websites",
  },
  [BLOG_ARTICLE_IDS.seoCostPortugal2026]: {
    id: BLOG_ARTICLE_IDS.seoCostPortugal2026,
    slugs: {
      "pt-PT": "quanto-custa-seo-em-portugal",
      en: "how-much-does-seo-cost-in-portugal",
    },
    publishedAt: "2026-09-26",
    category: "seo",
  },
  [BLOG_ARTICLE_IDS.professionalVsCheapWebsite]: {
    id: BLOG_ARTICLE_IDS.professionalVsCheapWebsite,
    slugs: {
      "pt-PT": "website-profissional-vs-website-barato",
      en: "professional-website-vs-cheap-website",
    },
    publishedAt: "2026-09-26",
    category: "websites",
  },
  [BLOG_ARTICLE_IDS.whatIsSeo]: {
    id: BLOG_ARTICLE_IDS.whatIsSeo,
    slugs: {
      "pt-PT": "o-que-e-seo",
      en: "what-is-seo",
    },
    publishedAt: "2026-09-26",
    category: "seo",
  },
  [BLOG_ARTICLE_IDS.websiteVsWebApp]: {
    id: BLOG_ARTICLE_IDS.websiteVsWebApp,
    slugs: {
      "pt-PT": "website-ou-aplicacao-web",
      en: "website-vs-web-application",
    },
    publishedAt: "2026-09-26",
    category: "websites",
  },
  [BLOG_ARTICLE_IDS.aiPoweredWebsite]: {
    id: BLOG_ARTICLE_IDS.aiPoweredWebsite,
    slugs: {
      "pt-PT": "website-com-ia",
      en: "ai-powered-website",
    },
    publishedAt: "2026-09-26",
    category: "ia",
  },
};

export const BLOG_ARTICLE_LIST = Object.values(BLOG_ARTICLES).sort(
  (a, b) => b.publishedAt.localeCompare(a.publishedAt),
);

export function getBlogArticleBySlug(
  slug: string,
  locale: "pt-PT" | "en",
): BlogArticleDefinition | null {
  return (
    Object.values(BLOG_ARTICLES).find((article) => article.slugs[locale] === slug) ??
    null
  );
}
