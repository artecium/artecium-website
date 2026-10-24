import { BlogArticlePage } from "@/components/blog/BlogArticlePage";
import { ServicePageShell } from "@/components/services/ServicePageShell";
import { BLOG_ARTICLE_IDS } from "@/lib/blog/types";
import { buildBlogArticleMetadata } from "@/lib/blog/metadata";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";

const ARTICLE_ID = BLOG_ARTICLE_IDS.websiteCostPortugal2026;

export async function generateMetadata() {
  const t = await getTranslationsForLocale("pt-PT", `blog.articles.${ARTICLE_ID}.metadata`);

  return buildBlogArticleMetadata(ARTICLE_ID, "pt-PT", {
    title: t("title"),
    description: t("description"),
  });
}

export default function WebsiteCostArticlePt() {
  return (
    <ServicePageShell locale="pt-PT">
      <BlogArticlePage articleId={ARTICLE_ID} locale="pt-PT" />
    </ServicePageShell>
  );
}
