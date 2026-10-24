import { SITE_URL } from "@/config/seo";

interface FaqSchemaItem {
  question: string;
  answer: string;
}

interface FaqPageSchemaInput {
  path: string;
  pageName: string;
  pageDescription: string;
  inLanguage: string;
  breadcrumbItems: Array<{ name: string; path: string }>;
  faqItems: FaqSchemaItem[];
}

export function getFaqPageStructuredData({
  path,
  pageName,
  pageDescription,
  inLanguage,
  breadcrumbItems,
  faqItems,
}: FaqPageSchemaInput) {
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
