import { ProductLandingPage } from "@/components/product-landing/ProductLandingPage";
import { buildClientAreaLandingMetadata } from "@/lib/product-landing/metadata";
import {
  CLIENT_LOGIN_NEXT,
  getClientAreaLandingPath,
} from "@/lib/product-landing/paths";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";

const META_TITLE = "Client Area | Artecium";

export async function generateMetadata() {
  const t = await getTranslationsForLocale("en", "productLanding.clientArea.meta");

  return buildClientAreaLandingMetadata("en", {
    title: META_TITLE,
    description: t("description"),
  });
}

export default async function ClientAreaLandingEnPage() {
  const t = await getTranslationsForLocale("en", "productLanding.clientArea");
  const path = getClientAreaLandingPath("en");

  const features = [
    { title: t("features.projects.title"), description: t("features.projects.description") },
    { title: t("features.documents.title"), description: t("features.documents.description") },
    { title: t("features.invoices.title"), description: t("features.invoices.description") },
    { title: t("features.support.title"), description: t("features.support.description") },
  ];

  return (
    <ProductLandingPage
      locale="en"
      path={path}
      structuredName={META_TITLE}
      structuredDescription={t("meta.description")}
      eyebrow={t("eyebrow")}
      h1={t("h1")}
      intro={t("intro")}
      features={features}
      primaryCta={{ href: CLIENT_LOGIN_NEXT, label: t("primaryCta") }}
    />
  );
}