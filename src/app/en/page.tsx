import { HomePageContent } from "@/components/home/HomePageContent";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import { buildAlternateLanguages } from "@/lib/seo/hreflang";
import { constructMetadata } from "@/lib/seo/metadata";

export async function generateMetadata() {
  const t = await getTranslationsForLocale("en", "metadata");

  return {
    ...constructMetadata({
      title: t("siteTitle"),
      description: t("siteDescription"),
      path: "/en",
      openGraphLocale: "en_US",
      alternateLanguages: buildAlternateLanguages("/", "/en"),
    }),
    title: t("siteTitle"),
  };
}

export default async function HomeEn() {
  const t = await getTranslationsForLocale("en", "metadata");

  return (
    <HomePageContent
      locale="en"
      pageName={t("siteTitle")}
      pageDescription={t("siteDescription")}
    />
  );
}
