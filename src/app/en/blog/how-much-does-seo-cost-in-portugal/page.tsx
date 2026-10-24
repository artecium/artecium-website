import { StandardBlogArticlePage } from "@/components/blog/StandardBlogArticlePage";
import { ServicePageShell } from "@/components/services/ServicePageShell";
import { BLOG_ARTICLE_IDS } from "@/lib/blog/types";
import { buildBlogArticleMetadata } from "@/lib/blog/metadata";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";

const ARTICLE_ID = BLOG_ARTICLE_IDS.seoCostPortugal2026;

export async function generateMetadata() {
  const t = await getTranslationsForLocale("en", `blog.articles.${ARTICLE_ID}.metadata`);

  return buildBlogArticleMetadata(ARTICLE_ID, "en", {
    title: t("title"),
    description: t("description"),
  });
}

export default function SeoCostArticleEn() {
  return (
    <ServicePageShell locale="en">
      <StandardBlogArticlePage articleId={ARTICLE_ID} locale="en" />
    </ServicePageShell>
  );
}
