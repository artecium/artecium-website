import { SITE_URL } from "@/config/seo";

interface BlogArticleFaqItem {
  question: string;
  answer: string;
}

interface BlogArticleSchemaInput {
  path: string;
  headline: string;
  description: string;
  inLanguage: string;
  datePublished: string;
  breadcrumbItems: Array<{ name: string; path: string }>;
  faqItems: BlogArticleFaqItem[];
}

export function getBlogArticleStructuredData({
  path,
  headline,
  description,
  inLanguage,
  datePublished,
  breadcrumbItems,
  faqItems,
}: BlogArticleSchemaInput) {
  const pageUrl = `${SITE_URL}${path}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: headline,
        description,
        inLanguage,
        isPartOf: {
          "@id": `${SITE_URL}/#website`,
        },
      },
      {
        "@type": "BlogPosting",
        "@id": `${pageUrl}#article`,
        headline,
        description,
        url: pageUrl,
        datePublished,
        inLanguage,
        author: {
          "@id": `${SITE_URL}/#organization`,
        },
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
        mainEntityOfPage: {
          "@id": `${pageUrl}#webpage`,
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
