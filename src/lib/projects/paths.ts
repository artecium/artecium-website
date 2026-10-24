import type { AppLocale } from "@/i18n/config";
import type { ProjectDefinition } from "@/lib/projects/types";

export function getProjectsHubPath(locale: AppLocale): string {
  return locale === "en" ? "/en/projetos" : "/projetos";
}

export function getAlternateProjectsHubPath(currentLocale: AppLocale): string {
  const alternateLocale: AppLocale = currentLocale === "en" ? "pt-PT" : "en";
  return getProjectsHubPath(alternateLocale);
}

export function getProjectPath(slug: string, locale: AppLocale): string {
  const base = getProjectsHubPath(locale);
  return `${base}/${slug}`;
}

export function getAlternateProjectPath(
  project: ProjectDefinition,
  currentLocale: AppLocale,
): string {
  const alternateLocale: AppLocale = currentLocale === "en" ? "pt-PT" : "en";
  return getProjectPath(project.slugs[alternateLocale], alternateLocale);
}
