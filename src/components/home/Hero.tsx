"use client";

import { HeroVisual } from "@/components/home/HeroVisual";
import SpinningBorderButton from "@/components/ui/spinning-border-button";
import { useWizard } from "@/hooks/useWizardContext";
import { useTranslations } from "next-intl";

export function Hero() {
  const { open } = useWizard();
  const t = useTranslations("home.hero");

  const pillars = t.raw("pillars") as string[];

  return (
    <section
      className="relative overflow-hidden px-6 pb-16 pt-16 sm:px-10 sm:pb-20 sm:pt-20 lg:px-16 lg:pb-24 lg:pt-28"
      aria-labelledby="hero-heading"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-1/4 top-0 h-[600px] w-[600px] rounded-full bg-[#2563EB]/[0.04] blur-[120px] animate-glow-pulse" />
        <div className="absolute -left-1/3 bottom-0 h-[400px] w-[400px] rounded-full bg-[#0D47A1]/[0.06] blur-[100px]" />
        <div className="animate-streak-drift absolute bottom-32 right-0 h-px w-1/2 bg-gradient-to-l from-transparent via-[#2563EB]/40 to-transparent" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2 lg:gap-12">
        <div className="max-w-xl lg:max-w-none">
          <div className="animate-fade-up mb-6 flex flex-wrap gap-2">
            {pillars.map((pillar) => (
              <span
                key={pillar}
                className="rounded-full border border-[#1E293B] bg-[#0E1324]/80 px-3 py-1 text-xs font-medium text-[#94A3B8] sm:text-sm"
              >
                {pillar}
              </span>
            ))}
          </div>

          <h1
            id="hero-heading"
            className="animate-fade-up-delay-1 text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl md:text-6xl lg:text-[4.25rem]"
          >
            {t("title")}
          </h1>

          <p className="animate-fade-up-delay-2 mt-7 max-w-lg text-lg leading-[1.7] text-[#94A3B8] sm:text-xl">
            {t("description")}
          </p>

          <div className="animate-fade-up-delay-2 mt-6 space-y-2 text-sm text-[#64748B] sm:text-base">
            <p>
              <span className="font-medium text-[#94A3B8]">{t("forWhoLabel")}</span>{" "}
              {t("forWho")}
            </p>
            <p>
              <span className="font-medium text-[#94A3B8]">{t("outcomeLabel")}</span>{" "}
              {t("outcome")}
            </p>
          </div>

          <div className="animate-fade-up-delay-3 mt-10 flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex w-full flex-col gap-2 sm:w-auto">
              <SpinningBorderButton
                className="group w-full sm:w-auto"
                onClick={open}
              >
                {t("startProject")}
                <svg
                  className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </SpinningBorderButton>
              <p className="text-center text-xs text-[#64748B] sm:text-left">
                {t("ctaMicrocopy")}
              </p>
            </div>
            <a
              href="#services"
              className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#1E293B] bg-[#0E1324] px-8 text-[0.9375rem] font-medium text-white transition-all duration-300 hover:border-[#334155] hover:bg-[#0E1324]/80 sm:w-auto"
            >
              {t("exploreServices")}
            </a>
          </div>
        </div>

        <div className="animate-fade-up-delay-2 hidden lg:block">
          <HeroVisual />
        </div>
      </div>

      <div className="relative mx-auto mt-12 max-w-7xl lg:hidden">
        <HeroVisual />
      </div>
    </section>
  );
}
