"use client";

import { StartProjectButton } from "@/components/contact/StartProjectButton";
import { PRICING_BUNDLE_KEYS } from "@/lib/pricing/config";
import { useTranslations } from "next-intl";

export function PricingBundles() {
  const t = useTranslations("home.pricing");

  return (
    <section
      className="mt-20 border-t border-[#1E293B]/60 pt-16"
      aria-labelledby="pricing-bundles-heading"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="pricing-bundles-heading"
          className="text-2xl font-semibold tracking-tight text-white sm:text-3xl"
        >
          {t("bundles.title")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#94A3B8] sm:text-base">
          {t("bundles.description")}
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {PRICING_BUNDLE_KEYS.map((key) => (
          <article
            key={key}
            className="flex h-full flex-col rounded-2xl border border-[#1E293B] bg-[#0E1324]/60 p-6"
          >
            <h3 className="text-lg font-semibold text-white">
              {t(`bundles.items.${key}.title`)}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[#94A3B8]">
              {t(`bundles.items.${key}.description`)}
            </p>
            <StartProjectButton
              variant="secondary"
              className="mt-6 w-full rounded-xl"
            >
              {t("cta.requestProposal")}
            </StartProjectButton>
          </article>
        ))}
      </div>
    </section>
  );
}