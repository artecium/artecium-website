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
    slug: project.slugs["pt-PT"],
  }));
}

export async function generateMetadata({ params }: ProjectSlugPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug, "pt-PT");

  if (!project) {
    return {};
  }

  const t = await getTranslationsForLocale(
    "pt-PT",
    `projects.items.${project.id}.metadata`,
  );

  return buildProjectMetadata(project, "pt-PT", {
    title: t("title"),
    description: t("description"),
  });
}

export default async function ProjectSlugPagePt({
  params,
}: ProjectSlugPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug, "pt-PT");

  if (!project) {
    notFound();
  }

  return (
    <ServicePageShell locale="pt-PT">
      <ProjectPage project={project} locale="pt-PT" />
    </ServicePageShell>
  );
}
