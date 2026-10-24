import { StartProjectButton } from "@/components/contact/StartProjectButton";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { ServiceBreadcrumb } from "@/components/services/ServiceBreadcrumb";
import type { AppLocale } from "@/i18n/config";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import { getProjectAlternateHref } from "@/lib/projects/metadata";
import { getProjectsHubPath } from "@/lib/projects/paths";
import type { ProjectDefinition } from "@/lib/projects/types";
import { projectStatusTone } from "@/lib/projects/types";
import Image from "next/image";
import Link from "next/link";

interface ProjectPageProps {
  project: ProjectDefinition;
  locale: AppLocale;
}

interface ProseSection {
  title: string;
  paragraphs: string[];
}

interface ListSection {
  title: string;
  intro?: string;
  items: string[];
}

function hasProseSection(section: ProseSection | undefined): section is ProseSection {
  return Boolean(section?.title && section.paragraphs?.length);
}

function hasListSection(section: ListSection | undefined): section is ListSection {
  return Boolean(section?.title && section.items?.length);
}

function loadOptionalProse(
  t: Awaited<ReturnType<typeof getTranslationsForLocale>>,
  key: string,
): ProseSection | undefined {
  if (!t.has(`${key}.title`)) return undefined;
  const paragraphs = t.raw(`${key}.paragraphs`) as string[] | undefined;
  if (!paragraphs?.length) return undefined;
  return { title: t(`${key}.title`), paragraphs };
}

function loadOptionalList(
  t: Awaited<ReturnType<typeof getTranslationsForLocale>>,
  key: string,
): ListSection | undefined {
  if (!t.has(`${key}.title`)) return undefined;
  const items = t.raw(`${key}.items`) as string[] | undefined;
  if (!items?.length) return undefined;
  return {
    title: t(`${key}.title`),
    intro: t.has(`${key}.intro`) ? t(`${key}.intro`) : undefined,
    items,
  };
}

export async function ProjectPage({ project, locale }: ProjectPageProps) {
  const itemNs = `projects.items.${project.id}`;
  const t = await getTranslationsForLocale(locale, itemNs);
  const tProjects = await getTranslationsForLocale(locale, "projects");
  const tNav = await getTranslationsForLocale(locale, "legal.nav");

  const homePath = locale === "en" ? "/en" : "/";
  const projectsPath = getProjectsHubPath(locale);

  const breadcrumbItems = [
    { label: tProjects("breadcrumb.home"), href: homePath },
    { label: tProjects("breadcrumb.current"), href: projectsPath },
    { label: t("title") },
  ];

  const context = loadOptionalProse(t, "context");
  const solution = loadOptionalProse(t, "solution");
  const objectives = loadOptionalList(t, "objectives");
  const features = loadOptionalList(t, "features");
  const technologies = loadOptionalList(t, "technologies");

  const gallery = project.galleryImages?.filter(Boolean) ?? [];
  const statusLabel = tProjects(`status.${project.status}`);
  const categoryLabel = tProjects(`categories.${project.category}`);

  return (
    <>
      <ServiceBreadcrumb
        items={breadcrumbItems}
        alternateHref={getProjectAlternateHref(project, locale)}
        alternateLabel={
          locale === "en" ? tNav("alternatePt") : tNav("alternateEn")
        }
        languageLabel={tNav("switchLanguage")}
      />

      <article className="px-6 pb-16 pt-8 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <header className="mb-12">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium tracking-wide text-[#64748B] uppercase">
                {categoryLabel}
              </span>
              <StatusBadge
                label={statusLabel}
                tone={projectStatusTone(project.status)}
              />
            </div>
            <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[#94A3B8]">
              {t("intro")}
            </p>
          </header>

          <div className="relative mb-12 aspect-[16/9] overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0E1324]">
            {project.coverImage ? (
              <Image
                src={project.coverImage}
                alt=""
                fill
                className="object-cover"
                priority
                sizes="(max-width: 896px) 100vw, 896px"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#1E293B] bg-[#050816] text-[#2563EB]">
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H5.25A2.25 2.25 0 003 5.25v13.5A2.25 2.25 0 005.25 21z"
                    />
                  </svg>
                </div>
                <p className="max-w-md text-sm leading-relaxed text-[#94A3B8]">
                  {tProjects("detail.mediaPlaceholder")}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-12">
            {hasProseSection(context) ? (
              <section aria-labelledby="project-context-heading">
                <h2
                  id="project-context-heading"
                  className="text-2xl font-semibold text-white"
                >
                  {context.title}
                </h2>
                <div className="mt-4 space-y-4 text-base leading-relaxed text-[#94A3B8]">
                  {context.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ) : null}

            {hasProseSection(solution) ? (
              <section aria-labelledby="project-solution-heading">
                <h2
                  id="project-solution-heading"
                  className="text-2xl font-semibold text-white"
                >
                  {solution.title}
                </h2>
                <div className="mt-4 space-y-4 text-base leading-relaxed text-[#94A3B8]">
                  {solution.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ) : null}

            {hasListSection(objectives) ? (
              <section aria-labelledby="project-objectives-heading">
                <h2
                  id="project-objectives-heading"
                  className="text-2xl font-semibold text-white"
                >
                  {objectives.title}
                </h2>
                {objectives.intro ? (
                  <p className="mt-4 text-base leading-relaxed text-[#94A3B8]">
                    {objectives.intro}
                  </p>
                ) : null}
                <ul className="mt-4 list-inside list-disc space-y-2 text-base text-[#94A3B8]">
                  {objectives.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {hasListSection(features) ? (
              <section aria-labelledby="project-features-heading">
                <h2
                  id="project-features-heading"
                  className="text-2xl font-semibold text-white"
                >
                  {features.title}
                </h2>
                {features.intro ? (
                  <p className="mt-4 text-base leading-relaxed text-[#94A3B8]">
                    {features.intro}
                  </p>
                ) : null}
                <ul className="mt-4 list-inside list-disc space-y-2 text-base text-[#94A3B8]">
                  {features.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {hasListSection(technologies) ? (
              <section aria-labelledby="project-tech-heading">
                <h2
                  id="project-tech-heading"
                  className="text-2xl font-semibold text-white"
                >
                  {technologies.title}
                </h2>
                {technologies.intro ? (
                  <p className="mt-4 text-base leading-relaxed text-[#94A3B8]">
                    {technologies.intro}
                  </p>
                ) : null}
                <ul className="mt-4 flex flex-wrap gap-2">
                  {technologies.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-[#1E293B] bg-[#0E1324] px-3 py-1 text-sm text-[#94A3B8]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {gallery.length > 0 ? (
              <section aria-labelledby="project-gallery-heading">
                <h2
                  id="project-gallery-heading"
                  className="text-2xl font-semibold text-white"
                >
                  {tProjects("detail.galleryTitle")}
                </h2>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {gallery.map((src) => (
                    <li
                      key={src}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#1E293B] bg-[#0E1324]"
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 400px"
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {project.status === "development" && t.has("statusNote") ? (
              <aside className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-6">
                <p className="text-sm leading-relaxed text-amber-100/90">
                  {t("statusNote")}
                </p>
              </aside>
            ) : null}
          </div>

          <section
            aria-labelledby="project-cta-heading"
            className="mt-16 rounded-2xl border border-[#1E293B] bg-[#0E1324]/80 p-8 text-center"
          >
            <h2
              id="project-cta-heading"
              className="text-2xl font-semibold text-white"
            >
              {tProjects("cta.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[#94A3B8]">
              {tProjects("cta.description")}
            </p>
            <div className="mt-8">
              <StartProjectButton className="w-full sm:w-auto">
                {tProjects("cta.button")}
              </StartProjectButton>
            </div>
            <p className="mt-6">
              <Link
                href={projectsPath}
                className="text-sm font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
              >
                ← {tProjects("detail.backToProjects")}
              </Link>
            </p>
          </section>
        </div>
      </article>
    </>
  );
}
