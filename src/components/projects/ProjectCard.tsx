import { AlmarProjectCardCover } from "@/components/projects/AlmarProjectCardCover";
import { ProjectCardCover } from "@/components/projects/ProjectCardCover";
import { StatusBadge } from "@/components/platform/StatusBadge";
import type { AppLocale } from "@/i18n/config";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import { getProjectPath } from "@/lib/projects/paths";
import type { ProjectDefinition } from "@/lib/projects/types";
import { PROJECT_IDS, projectStatusTone } from "@/lib/projects/types";
import Link from "next/link";

interface ProjectCardProps {
  project: ProjectDefinition;
  locale: AppLocale;
}

export async function ProjectCard({ project, locale }: ProjectCardProps) {
  const t = await getTranslationsForLocale(
    locale,
    `projects.items.${project.id}`,
  );
  const tProjects = await getTranslationsForLocale(locale, "projects");
  const href = getProjectPath(project.slugs[locale], locale);
  const title = t("title");
  const shortDescription = t("shortDescription");
  const statusLabel = tProjects(`status.${project.status}`);
  const categoryLabel = tProjects(`categories.${project.category}`);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0E1324]/60 transition-all duration-300 hover:border-[#2563EB]/30 hover:shadow-[0_8px_40px_rgba(37,99,235,0.08)]">
      <Link
        href={href}
        className="relative block aspect-[16/10] overflow-hidden bg-[#0E1324] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]"
      >
        {project.id === PROJECT_IDS.almarBeachClub && project.coverVideo ? (
          <AlmarProjectCardCover coverVideo={project.coverVideo} />
        ) : (
          <ProjectCardCover
            coverVideo={project.coverVideo}
            coverImage={project.coverImage}
            placeholderLabel={tProjects("card.previewPlaceholder")}
          />
        )}
        <span className="sr-only">{title}</span>
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium tracking-wide text-[#64748B] uppercase">
            {categoryLabel}
          </span>
          <StatusBadge
            label={statusLabel}
            tone={projectStatusTone(project.status)}
          />
        </div>
        <h2 className="text-xl font-semibold text-white">
          <Link
            href={href}
            className="rounded-sm transition-colors hover:text-[#93C5FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
          >
            {title}
          </Link>
        </h2>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-[#94A3B8]">
          {shortDescription}
        </p>
        <p className="mt-5">
          <Link
            href={href}
            className="text-sm font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
          >
            {tProjects("card.viewProject")} →
          </Link>
        </p>
      </div>
    </article>
  );
}
