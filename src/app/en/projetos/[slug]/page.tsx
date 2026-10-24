import { ProjectPage } from "@/components/projects/ProjectPage";
import { ServicePageShell } from "@/components/services/ServicePageShell";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import { buildProjectMetadata } from "@/lib/projects/metadata";
import { PROJECTS, getProjectBySlug } from "@/lib/projects/registry";
import { notFound } from "next/navigation";

interface ProjectSlugPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return PROJECTS.map((project) => ({
    slug: project.slugs.en,
  }));
}

export async function generateMetadata({ params }: ProjectSlugPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug, "en");

  if (!project) {
    return {};
  }

  const t = await getTranslationsForLocale(
    "en",
    `projects.items.${project.id}.metadata`,
  );

  return buildProjectMetadata(project, "en", {
    title: t("title"),
    description: t("description"),
  });
}

export default async function ProjectSlugPageEn({
  params,
}: ProjectSlugPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug, "en");

  if (!project) {
    notFound();
  }

  return (
    <ServicePageShell locale="en">
      <ProjectPage project={project} locale="en" />
    </ServicePageShell>
  );
}
