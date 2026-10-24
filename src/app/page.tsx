import { HomePageContent } from "@/components/home/HomePageContent";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import { buildAlternateLanguages } from "@/lib/seo/hreflang";
import { constructMetadata } from "@/lib/seo/metadata";

export async function generateMetadata() {
  const t = await getTranslationsForLocale("pt-PT", "metadata");

  return {
    ...constructMetadata({
      title: t("siteTitle"),
      description: t("siteDescription"),
      path: "/",
      openGraphLocale: "pt_PT",
      alternateLanguages: buildAlternateLanguages("/", "/en"),
    }),
    title: t("siteTitle"),
  };
}

export default async function Home() {
  const t = await getTranslationsForLocale("pt-PT", "metadata");

  return (
    <HomePageContent
      locale="pt-PT"
      pageName={t("siteTitle")}
      pageDescription={t("siteDescription")}
    />
  );
}
