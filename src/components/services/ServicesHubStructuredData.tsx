import { getServicesHubStructuredData } from "@/lib/seo/services-hub-schema";

interface ServicesHubStructuredDataProps {
  path: string;
  pageName: string;
  pageDescription: string;
  inLanguage: string;
  breadcrumbItems: Array<{ name: string; path: string }>;
  services: Array<{ name: string; path: string; description: string }>;
}

export function ServicesHubStructuredData(props: ServicesHubStructuredDataProps) {
  const structuredData = getServicesHubStructuredData(props);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
