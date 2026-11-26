"use client";

import { HomeFaqAccordion } from "@/components/home/HomeFaqAccordion";
import { PRICING_FAQ_KEYS } from "@/lib/pricing/config";
import { useTranslations } from "next-intl";

export function PricingPageFaq() {
  const t = useTranslations("home.pricing");

  const items = PRICING_FAQ_KEYS.map((key) => ({
    id: key,
    question: t(`faq.items.${key}.question`),
    answer: t(`faq.items.${key}.answer`),
    openDetailsAria: t(`faq.items.${key}.question`),
  }));

  return (
    <section
      className="mt-20 border-t border-[#1E293B]/60 pt-16"
      aria-labelledby="pricing-faq-heading"
    >
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2
            id="pricing-faq-heading"
            className="text-2xl font-semibold tracking-tight text-white sm:text-3xl"
          >
            {t("pageFaq.title")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#94A3B8] sm:text-base">
            {t("pageFaq.description")}
          </p>
        </div>

        <HomeFaqAccordion
          items={items.map(({ id, question, answer, openDetailsAria }) => ({
            id,
            question,
            answer,
            openDetailsAria,
          }))}
          listLabel={t("pageFaq.title")}
          className="mt-10"
        />
      </div>
    </section>
  );
}