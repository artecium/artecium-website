import { getBlogHubStructuredData } from "@/lib/seo/blog-hub-schema";

interface BlogHubStructuredDataProps {
  path: string;
  name: string;
  description: string;
  inLanguage: string;
  breadcrumbItems: Array<{ name: string; path: string }>;
  articles: Array<{ name: string; url: string; description: string }>;
}

export function BlogHubStructuredData(props: BlogHubStructuredDataProps) {
  const data = getBlogHubStructuredData(props);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
