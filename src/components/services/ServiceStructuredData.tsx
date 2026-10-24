import { getServicePageStructuredData } from "@/lib/seo/service-page-schema";

interface ServiceStructuredDataProps {
  path: string;
  pageName: string;
  pageDescription: string;
  serviceName: string;
  serviceDescription: string;
  inLanguage: string;
  breadcrumbItems: Array<{ name: string; path: string }>;
  faqItems: Array<{ question: string; answer: string }>;
}

export function ServiceStructuredData(props: ServiceStructuredDataProps) {
  const structuredData = getServicePageStructuredData(props);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
