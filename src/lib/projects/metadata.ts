import type { AppLocale } from "@/i18n/config";
import { SITE_NAME } from "@/config/seo";
import type { ProjectDefinition } from "@/lib/projects/types";
import {
  getAlternateProjectsHubPath,
  getProjectPath,
  getProjectsHubPath,
} from "@/lib/projects/paths";
import { buildAlternateLanguages } from "@/lib/seo/hreflang";
import { constructMetadata } from "@/lib/seo/metadata";

interface ProjectsMetadataInput {
  title: string;
  description: string;
}

export function buildProjectsMetadata(
  locale: AppLocale,
  meta: ProjectsMetadataInput,
) {
  const path = getProjectsHubPath(locale);
  const fullTitle = meta.title.includes(SITE_NAME)
    ? meta.title
    : `${meta.title} | ${SITE_NAME}`;

  return {
    ...constructMetadata({
      title: fullTitle,
      description: meta.description,
      path,
      openGraphLocale: locale === "en" ? "en_US" : "pt_PT",
      alternateLanguages: buildAlternateLanguages(
        getProjectsHubPath("pt-PT"),
        getProjectsHubPath("en"),
      ),
    }),
    title: { absolute: fullTitle },
  };
}

export function getProjectsAlternateHref(locale: AppLocale): string {
  return getAlternateProjectsHubPath(locale);
}

export function buildProjectMetadata(
  project: ProjectDefinition,
  locale: AppLocale,
  meta: ProjectsMetadataInput,
) {
  const path = getProjectPath(project.slugs[locale], locale);
  const fullTitle = meta.title.includes(SITE_NAME)
    ? meta.title
    : `${meta.title} | ${SITE_NAME}`;

  return {
    ...constructMetadata({
      title: fullTitle,
      description: meta.description,
      path,
      openGraphLocale: locale === "en" ? "en_US" : "pt_PT",
      alternateLanguages: buildAlternateLanguages(
        getProjectPath(project.slugs["pt-PT"], "pt-PT"),
        getProjectPath(project.slugs.en, "en"),
      ),
    }),
    title: { absolute: fullTitle },
  };
}

export function getProjectAlternateHref(
  project: ProjectDefinition,
  locale: AppLocale,
): string {
  const alternateLocale: AppLocale = locale === "en" ? "pt-PT" : "en";
  return getProjectPath(project.slugs[alternateLocale], alternateLocale);
}
