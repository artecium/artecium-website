import { getProjectsHubPath } from "@/lib/projects/paths";
import { resolveRequestLocale } from "@/lib/i18n/resolve-locale";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import Link from "next/link";

export async function ProjectsCTA() {
  const locale = await resolveRequestLocale();
  const t = await getTranslationsForLocale(locale, "home.projectsCta");
  const projectsPath = getProjectsHubPath(locale);

  return (
    <section
      aria-labelledby="projects-cta-heading"
      className="px-6 py-12 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2
          id="projects-cta-heading"
          className="text-lg font-semibold text-white sm:text-xl"
        >
          {t("title")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#94A3B8] sm:text-base">
          {t("description")}
        </p>
        <Link
          href={projectsPath}
          className="mt-6 inline-flex text-sm font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
        >
          {t("link")}
        </Link>
      </div>
    </section>
  );
}
