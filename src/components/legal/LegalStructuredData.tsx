import { getLegalPageStructuredData } from "@/lib/seo/legal-schema";

interface LegalStructuredDataProps {
  path: string;
  pageName: string;
  pageDescription: string;
  inLanguage: string;
  breadcrumbItems: Array<{ name: string; path: string }>;
}

export function LegalStructuredData(props: LegalStructuredDataProps) {
  const data = getLegalPageStructuredData(props);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
