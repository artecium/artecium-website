import { SectionHeader } from "@/components/ui/SectionHeader";
import { getTranslations } from "next-intl/server";

const problemKeys = [
  "outdatedWebsite",
  "fewLeads",
  "manualProcesses",
  "scatteredInfo",
] as const;

const solutionKeys = ["websites", "ia", "automation", "seo"] as const;

export async function BusinessProblems() {
  const t = await getTranslations("home.problems");

  return (
    <section
      id="problems"
      aria-labelledby="problems-heading"
      className="border-t border-[#1E293B]/60 bg-[#0E1324]/20 px-6 py-24 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          titleId="problems-heading"
        />

        <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {problemKeys.map((key) => (
            <li
              key={key}
              className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6 transition-colors duration-300 hover:border-[#2563EB]/25"
            >
              <h3 className="text-base font-semibold text-white">
                {t(`items.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
                {t(`items.${key}.description`)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-[#2563EB]/20 bg-[#0E1324]/60 p-8 text-center">
          <p className="text-sm font-medium tracking-widest text-[#64748B] uppercase">
            {t("solution.label")}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {solutionKeys.map((key, index) => (
              <span key={key} className="flex items-center gap-3">
                <span className="text-base font-semibold text-white sm:text-lg">
                  {t(`solution.items.${key}`)}
                </span>
                {index < solutionKeys.length - 1 ? (
                  <span className="text-[#2563EB]" aria-hidden="true">
                    +
                  </span>
                ) : null}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[#94A3B8] sm:text-base">
            {t("solution.description")}
          </p>
        </div>
      </div>
    </section>
  );
}
