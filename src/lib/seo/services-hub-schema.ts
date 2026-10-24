import { SITE_URL } from "@/config/seo";

interface HubServiceItem {
  name: string;
  path: string;
  description: string;
}

interface ServicesHubSchemaInput {
  path: string;
  pageName: string;
  pageDescription: string;
  inLanguage: string;
  breadcrumbItems: Array<{ name: string; path: string }>;
  services: HubServiceItem[];
}

export function getServicesHubStructuredData({
  path,
  pageName,
  pageDescription,
  inLanguage,
  breadcrumbItems,
  services,
}: ServicesHubSchemaInput) {
  const pageUrl = `${SITE_URL}${path}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: pageName,
        description: pageDescription,
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
        "@id": `${pageUrl}#services`,
        name: pageName,
        itemListElement: services.map((service, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: service.name,
          url: `${SITE_URL}${service.path}`,
          description: service.description,
        })),
      },
    ],
  };
}
