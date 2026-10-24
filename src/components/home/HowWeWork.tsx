import { StartProjectButton } from "@/components/contact/StartProjectButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getTranslations } from "next-intl/server";

const stepKeys = ["discovery", "strategy", "build", "launch"] as const;

export async function HowWeWork() {
  const t = await getTranslations("home.process");

  return (
    <section
      id="process"
      aria-labelledby="process-heading"
      className="border-t border-[#1E293B]/60 bg-[#0E1324]/20 px-6 py-24 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          titleId="process-heading"
        />

        <ol className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stepKeys.map((key, index) => (
            <li
              key={key}
              className="relative rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6"
            >
              <span className="text-sm font-semibold tracking-widest text-[#2563EB]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-white">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#94A3B8]">
                {t(`steps.${key}.description`)}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 text-center">
          <StartProjectButton className="w-full sm:w-auto">
            {t("cta")}
          </StartProjectButton>
        </div>
      </div>
    </section>
  );
}
