import { HomeFaqAccordion } from "@/components/home/HomeFaqAccordion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { marketing } from "@/lib/ui/marketing-classes";
import { getFaqPath } from "@/lib/faq/paths";
import { resolveRequestLocale } from "@/lib/i18n/resolve-locale";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import Link from "next/link";

const questionKeys = [
  "whatIsArtecium",
  "services",
  "customWebsites",
  "whatIsBooking",
  "howBookingWorks",
  "clientArea",
  "singleService",
  "proposal",
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
      id="faq"
      aria-labelledby="faq-preview-heading"
      className={`${marketing.section} ${marketing.sectionDivider} ${marketing.sectionAlt}`}
    >
      <div className="mx-auto max-w-3xl">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          titleId="faq-preview-heading"
        />

        <HomeFaqAccordion items={items} />

        <p className="mt-8 text-center">
          <Link href={faqPath} className={marketing.link}>
            {t("viewAll")}
          </Link>
        </p>
      </div>
    </section>
  );
}