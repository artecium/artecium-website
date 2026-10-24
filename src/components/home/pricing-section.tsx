"use client";

import { StartProjectButton } from "@/components/contact/StartProjectButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

const categories = ["websites", "aiAutomation", "seo"] as const;
type PricingCategory = (typeof categories)[number];

const plansByCategory: Record<PricingCategory, readonly string[]> = {
  websites: ["essential", "professional", "business"],
  aiAutomation: ["aiSolutions", "automation", "businessAutomation"],
  seo: ["foundation", "growth", "advanced"],
};

const featuredPlans: Partial<Record<PricingCategory, string>> = {
  websites: "professional",
};

function PricingCard({
  category,
  planKey,
  featured = false,
}: {
  category: PricingCategory;
  planKey: string;
  featured?: boolean;
}) {
  const t = useTranslations("home.pricing");
  const baseKey = `categories.${category}.plans.${planKey}`;

  const name = t(`${baseKey}.name`);
  const price = t(`${baseKey}.price`);
  const priceNote = t.has(`${baseKey}.priceNote`)
    ? t(`${baseKey}.priceNote`)
    : null;
  const description = t(`${baseKey}.description`);
  const cta = t(`${baseKey}.cta`);
  const features = t.raw(`${baseKey}.features`) as string[];

  return (
    <article
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl border bg-[#0E1324]/80 p-8 backdrop-blur-sm transition-all duration-300 ${
        featured
          ? "border-[#2563EB]/40 shadow-[0_8px_48px_rgba(37,99,235,0.12)] lg:-translate-y-1"
          : "border-[#1E293B] hover:border-[#2563EB]/25 hover:shadow-[0_8px_40px_rgba(37,99,235,0.08)]"
      }`}
    >
      {featured ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/60 to-transparent"
          aria-hidden="true"
        />
      ) : null}

      {featured ? (
        <span className="mb-5 inline-flex w-fit rounded-full border border-[#2563EB]/30 bg-[#2563EB]/10 px-3 py-1 text-[0.6875rem] font-semibold tracking-[0.14em] text-[#60A5FA] uppercase">
          {t("popularBadge")}
        </span>
      ) : (
        <span className="mb-5 block h-[1.625rem]" aria-hidden="true" />
      )}

      <h3 className="text-lg font-semibold text-white">{name}</h3>

      <div className="mt-4">
        <p className="text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
          {price}
        </p>
        {priceNote ? (
          <p className="mt-1 text-sm text-[#64748B]">{priceNote}</p>
        ) : null}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-[#94A3B8]">
        {description}
      </p>

      <ul className="mt-6 flex-1 space-y-3">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2.5 text-sm text-[#94A3B8]"
          >
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <StartProjectButton
        variant={featured ? "primary" : "secondary"}
        className="mt-8 w-full"
      >
        {cta}
      </StartProjectButton>
    </article>
  );
}

export function PricingSection() {
  const t = useTranslations("home.pricing");
  const [activeCategory, setActiveCategory] =
    useState<PricingCategory>("websites");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleTabChange = useCallback((category: PricingCategory) => {
    if (category === activeCategory) return;

    setIsTransitioning(true);
    window.setTimeout(() => {
      setActiveCategory(category);
      setIsTransitioning(false);
    }, 150);
  }, [activeCategory]);

  const featuredPlanKey = featuredPlans[activeCategory];

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="relative overflow-hidden border-y border-[#1E293B]/60 bg-[#050816] px-6 py-24 sm:px-10 lg:px-16"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#2563EB]/[0.03] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          titleId="pricing-heading"
        />

        <div
          className="mt-12 flex justify-center"
          role="tablist"
          aria-label={t("tabsLabel")}
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-[#1E293B] bg-[#0E1324]/80 p-1.5 backdrop-blur-sm">
            {categories.map((category) => {
              const isActive = category === activeCategory;

              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  id={`pricing-tab-${category}`}
                  aria-selected={isActive}
                  aria-controls={`pricing-panel-${category}`}
                  onClick={() => handleTabChange(category)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 sm:px-5 ${
                    isActive
                      ? "bg-[#2563EB] text-white shadow-[0_0_20px_rgba(37,99,235,0.25)]"
                      : "text-[#94A3B8] hover:text-white"
                  }`}
                >
                  {t(`tabs.${category}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div
          id={`pricing-panel-${activeCategory}`}
          role="tabpanel"
          aria-labelledby={`pricing-tab-${activeCategory}`}
          className={`mt-12 transition-all duration-300 ${
            isTransitioning
              ? "translate-y-1 opacity-0"
              : "translate-y-0 opacity-100"
          }`}
        >
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {plansByCategory[activeCategory].map((planKey) => (
              <PricingCard
                key={planKey}
                category={activeCategory}
                planKey={planKey}
                featured={featuredPlanKey === planKey}
              />
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-[#94A3B8] sm:text-base">
            {t("customQuote")}
          </p>
        </div>
      </div>
    </section>
  );
}
