"use client";

import { HeroVisual } from "@/components/home/HeroVisual";
import { StartProjectButton } from "@/components/contact/StartProjectButton";
import { marketing } from "@/lib/ui/marketing-classes";
import { useTranslations } from "next-intl";

export function Hero() {
  const t = useTranslations("home.hero");

  const pillars = t.raw("pillars") as string[];

  return (
    <section
      className="px-6 pb-16 pt-14 sm:px-10 sm:pb-20 sm:pt-16 lg:px-16 lg:pb-24 lg:pt-20"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="max-w-xl lg:max-w-none">
          <div className="mb-6 flex flex-wrap gap-2">
            {pillars.map((pillar) => (
              <span
                key={pillar}
                className="rounded-md border border-border bg-surface px-3 py-1 text-xs font-medium text-muted sm:text-sm"
              >
                {pillar}
              </span>
            ))}
          </div>

          <h1
            id="hero-heading"
            className="text-[2.5rem] font-semibold leading-[1.08] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-[3.75rem]"
          >
            {t("title")}
          </h1>

          <p className={`mt-6 max-w-lg ${marketing.body}`}>{t("description")}</p>

          <div className="mt-5 space-y-2 text-sm text-muted-subtle sm:text-base">
            <p>
              <span className="font-medium text-muted">{t("forWhoLabel")}</span>{" "}
              {t("forWho")}
            </p>
            <p>
              <span className="font-medium text-muted">{t("outcomeLabel")}</span>{" "}
              {t("outcome")}
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex w-full flex-col gap-2 sm:w-auto">
              <StartProjectButton className="w-full sm:w-auto">
                {t("startProject")}
              </StartProjectButton>
              <p className={`text-center sm:text-left ${marketing.caption}`}>
                {t("ctaMicrocopy")}
              </p>
            </div>
            <a href="#services" className={`w-full sm:w-auto ${marketing.btnSecondary}`}>
              {t("exploreServices")}
            </a>
          </div>
        </div>

        <div className="hidden lg:block">
          <HeroVisual />
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl lg:hidden">
        <HeroVisual />
      </div>
    </section>
  );
}