import { SITE_URL } from "@/config/seo";

const AREA_SERVED = {
  "@type": "Country",
  name: "Portugal",
};

interface FaqItem {
  question: string;
  answer: string;
}

interface ServicePageSchemaInput {
  path: string;
  pageName: string;
  pageDescription: string;
  serviceName: string;
  serviceDescription: string;
  inLanguage: string;
  breadcrumbItems: Array<{ name: string; path: string }>;
  faqItems: FaqItem[];
}

export function getServicePageStructuredData({
  path,
  pageName,
  pageDescription,
  serviceName,
  serviceDescription,
  inLanguage,
  breadcrumbItems,
  faqItems,
}: ServicePageSchemaInput) {
  const pageUrl = `${SITE_URL}${path}`;
  const webpageId = `${pageUrl}#webpage`;
  const serviceId = `${pageUrl}#service`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": webpageId,
        url: pageUrl,
        name: pageName,
        description: pageDescription,
        inLanguage,
        isPartOf: {
          "@id": `${SITE_URL}/#website`,
        },
        about: {
          "@id": serviceId,
        },
      },
      {
        "@type": "Service",
        "@id": serviceId,
        name: serviceName,
        description: serviceDescription,
        url: pageUrl,
        provider: {
          "@id": `${SITE_URL}/#organization`,
        },
        areaServed: AREA_SERVED,
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
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
}
