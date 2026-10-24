import { SectionHeader } from "@/components/ui/SectionHeader";
import { getTranslations } from "next-intl/server";

const locationKeys = [
  "portugal",
  "lisboa",
  "almada",
  "setubal",
  "margemSul",
] as const;

export async function ServiceArea() {
  const t = await getTranslations("home.serviceArea");

  return (
    <section
      id="service-area"
      aria-labelledby="service-area-heading"
      className="border-t border-[#1E293B]/60 px-6 py-20 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-4xl text-center">
        <SectionHeader
          title={t("title")}
          description={t("description")}
          titleId="service-area-heading"
        />

        <ul
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
          aria-label={t("locationsLabel")}
        >
          {locationKeys.map((key) => (
            <li key={key}>
              <span className="inline-flex rounded-full border border-[#1E293B] bg-[#0E1324] px-4 py-2 text-sm font-medium text-[#94A3B8]">
                {t(`locations.${key}`)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
