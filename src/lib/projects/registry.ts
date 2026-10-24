import type { ProjectDefinition, ProjectId } from "@/lib/projects/types";
import { PROJECT_IDS } from "@/lib/projects/types";

export const PROJECTS: ProjectDefinition[] = [
  {
    id: PROJECT_IDS.almarBeachClub,
    slugs: {
      "pt-PT": "almar-beach-club",
      en: "almar-beach-club",
    },
    category: "websites",
    status: "development",
    coverVideo: "/projects/almar/hero.mp4",
  },
];

export function getProjectBySlug(
  slug: string,
  locale: "pt-PT" | "en",
): ProjectDefinition | null {
  return (
    PROJECTS.find((project) => project.slugs[locale] === slug) ?? null
  );
}

export function getProjectById(id: ProjectId): ProjectDefinition | null {
  return PROJECTS.find((project) => project.id === id) ?? null;
}
