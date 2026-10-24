import { ProjectsPage } from "@/components/projects/ProjectsPage";
import { ServicePageShell } from "@/components/services/ServicePageShell";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import { buildProjectsMetadata } from "@/lib/projects/metadata";

export async function generateMetadata() {
  const t = await getTranslationsForLocale("en", "projects.metadata");

  return buildProjectsMetadata("en", {
    title: t("title"),
    description: t("description"),
  });
}

interface ProjectsHubPageEnProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function ProjectsHubPageEn({
  searchParams,
}: ProjectsHubPageEnProps) {
  const { category } = await searchParams;

  return (
    <ServicePageShell locale="en">
      <ProjectsPage locale="en" categoryFilter={category} />
    </ServicePageShell>
  );
}
