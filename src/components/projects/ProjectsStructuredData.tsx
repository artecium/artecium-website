import { getProjectsStructuredData } from "@/lib/seo/projects-schema";

interface ProjectsStructuredDataProps {
  path: string;
  name: string;
  description: string;
  inLanguage: string;
  breadcrumbItems: Array<{ name: string; path: string }>;
}

export function ProjectsStructuredData(props: ProjectsStructuredDataProps) {
  const data = getProjectsStructuredData(props);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
