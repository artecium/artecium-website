import { getFaqPageStructuredData } from "@/lib/seo/faq-schema";

interface FaqStructuredDataProps {
  path: string;
  pageName: string;
  pageDescription: string;
  inLanguage: string;
  breadcrumbItems: Array<{ name: string; path: string }>;
  faqItems: Array<{ question: string; answer: string }>;
}

export function FaqStructuredData(props: FaqStructuredDataProps) {
  const data = getFaqPageStructuredData(props);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
