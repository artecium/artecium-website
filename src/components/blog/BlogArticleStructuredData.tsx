import { getBlogArticleStructuredData } from "@/lib/seo/blog-article-schema";

interface BlogArticleStructuredDataProps {
  path: string;
  headline: string;
  description: string;
  inLanguage: string;
  datePublished: string;
  breadcrumbItems: Array<{ name: string; path: string }>;
  faqItems: Array<{ question: string; answer: string }>;
}

export function BlogArticleStructuredData(props: BlogArticleStructuredDataProps) {
  const data = getBlogArticleStructuredData(props);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
