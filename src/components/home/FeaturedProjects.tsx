import { ProjectCard } from "@/components/projects/ProjectCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { AppLocale } from "@/i18n/config";
import { resolveRequestLocale } from "@/lib/i18n/resolve-locale";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import { getProjectsHubPath } from "@/lib/projects/paths";
import { PROJECTS } from "@/lib/projects/registry";
import Link from "next/link";

interface FeaturedProjectsProps {
  locale?: AppLocale;
}

export async function FeaturedProjects({ locale }: FeaturedProjectsProps) {
  const resolvedLocale = locale ?? (await resolveRequestLocale());

  if (PROJECTS.length === 0) {
    return null;
  }

  const t = await getTranslationsForLocale(resolvedLocale, "home.featuredProjects");
  const projectsPath = getProjectsHubPath(resolvedLocale);

  return (
    <section
      id="featured-projects"
      aria-labelledby="featured-projects-heading"
      className="border-t border-[#1E293B]/60 px-6 py-24 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          titleId="featured-projects-heading"
        />

        <div
          className={`mt-16 grid gap-6 ${
            PROJECTS.length === 1
              ? "mx-auto max-w-xl sm:max-w-2xl"
              : "sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {PROJECTS.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              locale={resolvedLocale}
            />
          ))}
        </div>

        <p className="mt-10 text-center">
          <Link
            href={projectsPath}
            className="text-sm font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
          >
            {t("viewAll")} →
          </Link>
        </p>
      </div>
    </section>
  );
}
