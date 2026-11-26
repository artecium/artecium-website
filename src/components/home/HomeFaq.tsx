import { ArteciumAI } from "@/components/home/ArteciumAI";
import { HomeFaqAccordion } from "@/components/home/HomeFaqAccordion";
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

  const items = questionKeys.map((key) => ({
    id: key,
    question: t(`items.${key}.question`),
    answer: t(`items.${key}.answer`),
  }));

  return (
    <section
      id="faq-preview"
      aria-labelledby="faq-preview-heading"
      className="border-t border-[#1E293B]/60 px-6 py-24 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          titleId="faq-preview-heading"
        />

        <div className="mt-12 flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-10 xl:gap-12">
          <div className="min-w-0 w-full lg:w-[58%] lg:shrink-0">
            <HomeFaqAccordion
              items={items}
              listLabel={t("title")}
              className="mt-0"
            />
            <p className="mt-8">
              <Link
                href={faqPath}
                className="text-sm font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
              >
                {t("viewAll")}
              </Link>
            </p>
          </div>

          <aside className="min-w-0 w-full lg:w-[42%] lg:shrink-0 lg:self-stretch">
            <ArteciumAI embedded />
          </aside>
        </div>
      </div>
    </section>
  );
}