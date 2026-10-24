import { SITE_URL } from "@/config/seo";

interface ProjectsSchemaInput {
  path: string;
  name: string;
  description: string;
  inLanguage: string;
  breadcrumbItems: Array<{ name: string; path: string }>;
}

export function getProjectsStructuredData({
  path,
  name,
  description,
  inLanguage,
  breadcrumbItems,
}: ProjectsSchemaInput) {
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
    ],
  };
}
