"use client";

import { PricingBundles } from "@/components/home/pricing/PricingBundles";
import { PricingCompare } from "@/components/home/pricing/PricingCompare";
import { PricingExpandablePlans } from "@/components/home/pricing/PricingExpandablePlans";
import { PricingPageFaq } from "@/components/home/pricing/PricingPageFaq";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  PRICING_CATEGORIES,
  type PricingCategory,
} from "@/lib/pricing/config";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";

export function PricingSection() {
  const t = useTranslations("home.pricing");
  const [activeCategory, setActiveCategory] =
    useState<PricingCategory>("websites");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleTabChange = useCallback((category: PricingCategory) => {
    if (category === activeCategory) return;
    setIsTransitioning(true);
    window.setTimeout(() => {
      setActiveCategory(category);
      setIsTransitioning(false);
    }, 120);
  }, [activeCategory]);

  const onTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    category: PricingCategory,
    index: number,
  ) => {
    const lastIndex = PRICING_CATEGORIES.length - 1;
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = index === lastIndex ? 0 : index + 1;
    if (event.key === "ArrowLeft") nextIndex = index === 0 ? lastIndex : index - 1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = lastIndex;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextCategory = PRICING_CATEGORIES[nextIndex];
    handleTabChange(nextCategory);
    const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]',
    );
    buttons?.[nextIndex]?.focus();
  };

  const categoryNote = t(`categoryNotes.${activeCategory}`);

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="relative overflow-hidden border-y border-[#1E293B]/60 bg-[#050816] px-6 py-24 sm:px-10 lg:px-16"
    >
      <div className="relative mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          titleId="pricing-heading"
        />

        <div
          ref={tabListRef}
          className="mt-10 flex justify-center"
          role="tablist"
          aria-label={t("tabsLabel")}
        >
          <div className="flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#1E293B] bg-[#0E1324]/80 p-2 sm:gap-1.5 sm:rounded-full sm:p-1.5">
            {PRICING_CATEGORIES.map((category, index) => {
              const isActive = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  id={`pricing-tab-${category}`}
                  aria-selected={isActive}
                  aria-controls={`pricing-panel-${category}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => handleTabChange(category)}
                  onKeyDown={(event) => onTabKeyDown(event, category, index)}
                  className={`min-w-0 flex-1 rounded-xl px-3 py-2.5 text-center text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 sm:flex-none sm:rounded-full sm:px-5 ${
                    isActive
                      ? "bg-[#2563EB] text-white"
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
          className={`mt-10 transition-opacity duration-200 motion-reduce:transition-none ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          <PricingExpandablePlans category={activeCategory} />

          <p className="mt-8 max-w-3xl text-sm leading-relaxed text-[#94A3B8]">
            {categoryNote}
          </p>

          <PricingCompare category={activeCategory} />
        </div>

        <PricingBundles />
        <PricingPageFaq />
      </div>
    </section>
  );
}