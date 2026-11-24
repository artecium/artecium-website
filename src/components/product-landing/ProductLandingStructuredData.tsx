import { getWebPageSchema } from "@/lib/seo/json-ld";
import type { AppLocale } from "@/i18n/config";

interface ProductLandingStructuredDataProps {
  locale: AppLocale;
  path: string;
  name: string;
  description: string;
}

export function ProductLandingStructuredData({
  locale,
  path,
  name,
  description,
}: ProductLandingStructuredDataProps) {
  const structuredData = getWebPageSchema({
    path,
    name,
    description,
    inLanguage: locale === "en" ? "en" : "pt-PT",
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}