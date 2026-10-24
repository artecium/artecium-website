import { BlogHubPage } from "@/components/blog/BlogHubPage";
import { ServicePageShell } from "@/components/services/ServicePageShell";
import { buildBlogHubMetadata } from "@/lib/blog/metadata";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";

export async function generateMetadata() {
  const t = await getTranslationsForLocale("pt-PT", "blog.hub.metadata");

  return buildBlogHubMetadata("pt-PT", {
    title: t("title"),
    description: t("description"),
  });
}

export default function BlogHubPagePt() {
  return (
    <ServicePageShell locale="pt-PT">
      <BlogHubPage locale="pt-PT" />
    </ServicePageShell>
  );
}
