import { StartProjectButton } from "@/components/contact/StartProjectButton";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectCategoryNav } from "@/components/projects/ProjectCategoryNav";
import { ProjectsStructuredData } from "@/components/projects/ProjectsStructuredData";
import { ServiceBreadcrumb } from "@/components/services/ServiceBreadcrumb";
import type { AppLocale } from "@/i18n/config";
import { intlLocale } from "@/i18n/config";
import { getProjectsAlternateHref } from "@/lib/projects/metadata";
import { getProjectsHubPath } from "@/lib/projects/paths";
import { PROJECTS } from "@/lib/projects/registry";
import type { ProjectCategory } from "@/lib/projects/types";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";

const CATEGORY_VALUES: ProjectCategory[] = [
  "websites",
  "ia",
  "webapps",
  "seo",
];

function parseCategoryFilter(
  value: string | undefined,
): ProjectCategory | null {
  if (!value) return null;
  return CATEGORY_VALUES.includes(value as ProjectCategory)
    ? (value as ProjectCategory)
    : null;
}

interface ProjectsPageProps {
  locale: AppLocale;
  categoryFilter?: string;
}

export async function ProjectsPage({
  locale,
  categoryFilter,
}: ProjectsPageProps) {
  const t = await getTranslationsForLocale(locale, "projects");
  const tNav = await getTranslationsForLocale(locale, "legal.nav");

  const path = getProjectsHubPath(locale);
  const homePath = locale === "en" ? "/en" : "/";
  const activeCategory = parseCategoryFilter(categoryFilter);

  const visibleProjects = activeCategory
    ? PROJECTS.filter((project) => project.category === activeCategory)
    : PROJECTS;

  const breadcrumbItems = [
    { label: t("breadcrumb.home"), href: homePath },
    { label: t("breadcrumb.current") },
  ];

  const schemaBreadcrumb = [
    { name: t("breadcrumb.home"), path: homePath },
    { name: t("breadcrumb.current"), path },
  ];

  return (
    <>
      <ProjectsStructuredData
        path={path}
        name={t("metadata.title")}
        description={t("metadata.description")}
        inLanguage={intlLocale(locale)}
        breadcrumbItems={schemaBreadcrumb}
      />

      <ServiceBreadcrumb
        items={breadcrumbItems}
        alternateHref={getProjectsAlternateHref(locale)}
        alternateLabel={
          locale === "en" ? tNav("alternatePt") : tNav("alternateEn")
        }
        languageLabel={tNav("switchLanguage")}
      />

      <div className="px-6 pb-16 pt-8 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <header className="mb-12 max-w-3xl">
            <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {t("hero.title")}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[#94A3B8]">
              {t("hero.intro")}
            </p>
          </header>

          {PROJECTS.length > 0 ? (
            <ProjectCategoryNav
              locale={locale}
              activeCategory={activeCategory}
            />
          ) : null}

          {PROJECTS.length === 0 ? (
            <section
              aria-labelledby="projects-empty-heading"
              className="rounded-2xl border border-dashed border-[#1E293B] bg-[#0E1324]/40 p-10 text-center"
            >
              <h2
                id="projects-empty-heading"
                className="text-xl font-semibold text-white"
              >
                {t("empty.title")}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-[#94A3B8]">
                {t("empty.description")}
              </p>
            </section>
          ) : visibleProjects.length === 0 ? (
            <section
              aria-labelledby="projects-filter-empty-heading"
              className="rounded-2xl border border-dashed border-[#1E293B] bg-[#0E1324]/40 p-10 text-center"
            >
              <h2
                id="projects-filter-empty-heading"
                className="text-xl font-semibold text-white"
              >
                {t("filters.emptyTitle")}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-[#94A3B8]">
                {t("filters.emptyDescription")}
              </p>
            </section>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {visibleProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  locale={locale}
                />
              ))}
            </div>
          )}

          <section
            aria-labelledby="projects-cta-heading"
            className="mt-16 rounded-2xl border border-[#1E293B] bg-[#0E1324]/80 p-8 text-center"
          >
            <h2
              id="projects-cta-heading"
              className="text-2xl font-semibold text-white"
            >
              {t("cta.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[#94A3B8]">
              {t("cta.description")}
            </p>
            <div className="mt-8">
              <StartProjectButton className="w-full sm:w-auto">
                {t("cta.button")}
              </StartProjectButton>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
