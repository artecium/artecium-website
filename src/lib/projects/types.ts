import type { AppLocale } from "@/i18n/config";

export const PROJECT_IDS = {
  almarBeachClub: "almarBeachClub",
} as const;

export type ProjectId = (typeof PROJECT_IDS)[keyof typeof PROJECT_IDS];

export type ProjectCategory =
  | "websites"
  | "ia"
  | "webapps"
  | "seo";

export type ProjectStatus =
  | "demo"
  | "concept"
  | "own"
  | "development"
  | "live";

export interface ProjectDefinition {
  id: ProjectId;
  slugs: Record<AppLocale, string>;
  category: ProjectCategory;
  status: ProjectStatus;
  /** Path under public/, e.g. /projects/almar/cover.webp */
  coverImage?: string;
  /** Path under public/, e.g. /projects/almar/hero.mp4 */
  coverVideo?: string;
  galleryImages?: string[];
}

export type ProjectStatusTone = "default" | "success" | "warning" | "info";

export function projectStatusTone(status: ProjectStatus): ProjectStatusTone {
  switch (status) {
    case "live":
      return "success";
    case "development":
      return "warning";
    case "concept":
    case "demo":
      return "info";
    default:
      return "default";
  }
}
