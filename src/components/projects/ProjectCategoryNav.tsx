import type { AppLocale } from "@/i18n/config";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import { getProjectsHubPath } from "@/lib/projects/paths";
import type { ProjectCategory } from "@/lib/projects/types";
import Link from "next/link";

const CATEGORY_ORDER: ProjectCategory[] = [
  "websites",
  "ia",
  "webapps",
  "seo",
];

interface ProjectCategoryNavProps {
  locale: AppLocale;
  activeCategory?: ProjectCategory | null;
}

export async function ProjectCategoryNav({
  locale,
  activeCategory,
}: ProjectCategoryNavProps) {
  const t = await getTranslationsForLocale(locale, "projects");
  const hubPath = getProjectsHubPath(locale);

  const linkClass = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 ${
      active
        ? "border-[#2563EB]/40 bg-[#2563EB]/10 text-white"
        : "border-[#1E293B] text-[#94A3B8] hover:border-[#2563EB]/25 hover:text-white"
    }`;

  return (
    <nav
      className="mb-10 flex flex-wrap gap-3"
      aria-label={t("filters.label")}
    >
      <Link href={hubPath} className={linkClass(!activeCategory)}>
        {t("filters.all")}
      </Link>
      {CATEGORY_ORDER.map((category) => (
        <Link
          key={category}
          href={`${hubPath}?category=${category}`}
          className={linkClass(activeCategory === category)}
          aria-current={activeCategory === category ? "true" : undefined}
        >
          {t(`categories.${category}`)}
        </Link>
      ))}
    </nav>
  );
}
