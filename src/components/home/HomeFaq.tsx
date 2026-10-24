import { ArteciumAI } from "@/components/home/ArteciumAI";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getFaqPath } from "@/lib/faq/paths";
import { resolveRequestLocale } from "@/lib/i18n/resolve-locale";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import Link from "next/link";

const questionKeys = [
  "websiteCost",
  "includesSeo",
  "addFeaturesLater",
  "portugal",
  "seoOnly",
  "howToStart",
] as const;

export async function HomeFaq() {
  const locale = await resolveRequestLocale();
  const t = await getTranslationsForLocale(locale, "home.faqPreview");
  const faqPath = getFaqPath(locale);

  return (
    <section
      id="faq-preview"
      aria-labelledby="faq-preview-heading"
      className="border-t border-[#1E293B]/60 px-6 py-24 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-3xl">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          titleId="faq-preview-heading"
        />

        <div className="mt-12 space-y-3">
          {questionKeys.map((key) => (
            <details
              key={key}
              className="group rounded-xl border border-[#1E293B] bg-[#0E1324] open:border-[#2563EB]/30"
            >
              <summary className="cursor-pointer list-none px-5 py-4 text-base font-medium text-white marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {t(`items.${key}.question`)}
                  <span
                    className="text-[#64748B] transition-transform duration-200 group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </span>
              </summary>
              <div className="border-t border-[#1E293B]/80 px-5 py-4 text-sm leading-relaxed text-[#94A3B8]">
                {t(`items.${key}.answer`)}
              </div>
            </details>
          ))}
        </div>

        <p className="mt-8 text-center">
          <Link
            href={faqPath}
            className="text-sm font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
          >
            {t("viewAll")}
          </Link>
        </p>

        <ArteciumAI />
      </div>
    </section>
  );
}
