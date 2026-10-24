import { getWebPageSchema } from "@/lib/seo/json-ld";
import { SITE_URL } from "@/config/seo";

interface LegalPageSchemaInput {
  path: string;
  pageName: string;
  pageDescription: string;
  inLanguage: string;
  breadcrumbItems: Array<{ name: string; path: string }>;
}

export function getLegalPageStructuredData({
  path,
  pageName,
  pageDescription,
  inLanguage,
  breadcrumbItems,
}: LegalPageSchemaInput) {
  const pageUrl = `${SITE_URL}${path}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      getWebPageSchema({
        path,
        name: pageName,
        description: pageDescription,
        inLanguage,
      }),
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: breadcrumbItems.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${SITE_URL}${item.path === "/" ? "" : item.path}`,
        })),
      },
    ],
  };
}
