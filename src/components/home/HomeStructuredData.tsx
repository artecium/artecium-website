import type { AppLocale } from "@/i18n/config";
import { intlLocale } from "@/i18n/config";
import { getWebPageSchema } from "@/lib/seo/json-ld";

interface HomeStructuredDataProps {
  locale: AppLocale;
  pageName: string;
  pageDescription: string;
}

export function HomeStructuredData({
  locale,
  pageName,
  pageDescription,
}: HomeStructuredDataProps) {
  const path = locale === "en" ? "/en" : "/";
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      getWebPageSchema({
        path,
        name: pageName,
        description: pageDescription,
        inLanguage: intlLocale(locale),
      }),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
