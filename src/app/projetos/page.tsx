import { ProjectsPage } from "@/components/projects/ProjectsPage";
import { ServicePageShell } from "@/components/services/ServicePageShell";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import { buildProjectsMetadata } from "@/lib/projects/metadata";

export async function generateMetadata() {
  const t = await getTranslationsForLocale("pt-PT", "projects.metadata");

  return buildProjectsMetadata("pt-PT", {
    title: t("title"),
    description: t("description"),
  });
}

interface ProjectsHubPagePtProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function ProjectsHubPagePt({
  searchParams,
}: ProjectsHubPagePtProps) {
  const { category } = await searchParams;

  return (
    <ServicePageShell locale="pt-PT">
      <ProjectsPage locale="pt-PT" categoryFilter={category} />
    </ServicePageShell>
  );
}
