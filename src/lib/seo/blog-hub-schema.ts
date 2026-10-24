import { SITE_URL } from "@/config/seo";

interface BlogHubSchemaInput {
  path: string;
  name: string;
  description: string;
  inLanguage: string;
  breadcrumbItems: Array<{ name: string; path: string }>;
  articles: Array<{ name: string; url: string; description: string }>;
}

export function getBlogHubStructuredData({
  path,
  name,
  description,
  inLanguage,
  breadcrumbItems,
  articles,
}: BlogHubSchemaInput) {
  const pageUrl = `${SITE_URL}${path}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name,
        description,
        inLanguage,
        isPartOf: {
          "@id": `${SITE_URL}/#website`,
        },
      },
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
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#articles`,
        name,
        description,
        itemListElement: articles.map((article, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: article.name,
          url: article.url,
          description: article.description,
        })),
      },
    ],
  };
}
