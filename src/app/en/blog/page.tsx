import { BlogHubPage } from "@/components/blog/BlogHubPage";
import { ServicePageShell } from "@/components/services/ServicePageShell";
import { buildBlogHubMetadata } from "@/lib/blog/metadata";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";

export async function generateMetadata() {
  const t = await getTranslationsForLocale("en", "blog.hub.metadata");

  return buildBlogHubMetadata("en", {
    title: t("title"),
    description: t("description"),
  });
}

export default function BlogHubPageEn() {
  return (
    <ServicePageShell locale="en">
      <BlogHubPage locale="en" />
    </ServicePageShell>
  );
}
