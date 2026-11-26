"use client";

import { StartProjectButton } from "@/components/contact/StartProjectButton";
import { resolveLocale, type AppLocale } from "@/i18n/config";
import { getBookingMarketingPath } from "@/lib/product-landing/paths";
import { getServicePath } from "@/lib/services/paths";
import { motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

const HERO_IMAGE = "/images/hero/hero-background.jpg";

const fadeUp = (delay = 0, reduceMotion: boolean | null) => ({
  initial: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: reduceMotion
    ? { duration: 0.01 }
    : { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const INDICATOR_KEYS = ["websites", "aiAutomation", "booking"] as const;

function indicatorHref(
  key: (typeof INDICATOR_KEYS)[number],
  locale: AppLocale,
): string {
  switch (key) {
    case "websites":
      return getServicePath("websites", locale);
    case "aiAutomation":
      return getServicePath("ia", locale);
    case "booking":
      return getBookingMarketingPath(locale);
  }
}

export function Hero() {
  const t = useTranslations("home.hero");
  const locale = resolveLocale(useLocale());
  const reduceMotion = useReducedMotion();

  return (
    <section
      className="relative min-h-[88vh] overflow-hidden sm:min-h-[90vh]"
      aria-labelledby="hero-heading"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src={HERO_IMAGE}
          alt={t("backgroundAlt")}
          fill
          priority
          sizes="100vw"
          className={`object-cover object-[68%_center] sm:object-[72%_center] lg:object-[80%_center] ${
            reduceMotion ? "" : "motion-safe:scale-105 motion-safe:animate-[hero-ken-burns_24s_ease-in-out_infinite_alternate]"
          }`}
        />
        <div className="absolute inset-0 bg-[#050816]/72" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050816]/95 via-[#050816]/75 to-[#050816]/25" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050816] to-transparent" />
      </div>

      <motion.div
        className="relative mx-auto flex min-h-[88vh] w-full max-w-7xl flex-col px-6 pb-10 pt-28 sm:min-h-[90vh] sm:px-10 sm:pb-12 sm:pt-32 lg:px-16 lg:pt-36"
        initial="initial"
        animate="animate"
      >
        <div className="flex flex-1 flex-col justify-center">
          <motion.p
            {...fadeUp(0, reduceMotion)}
            className="mb-5 text-[0.6875rem] font-semibold tracking-[0.22em] text-[#60A5FA] uppercase sm:text-xs"
          >
            {t("tagline")}
          </motion.p>

          <motion.h1
            id="hero-heading"
            {...fadeUp(0.08, reduceMotion)}
            className="max-w-4xl text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.03em] text-white sm:text-5xl md:text-6xl lg:text-[4.5rem]"
          >
            <span className="block">{t("titleLine1")}</span>
            <span className="mt-1 block text-[#CBD5E1]">{t("titleLine2")}</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.16, reduceMotion)}
            className="mt-6 max-w-xl text-base leading-relaxed text-[#94A3B8] sm:mt-7 sm:text-lg"
          >
            {t("description")}
          </motion.p>

          <motion.div
            {...fadeUp(0.24, reduceMotion)}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <Link
              href="#services"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#2563EB] px-8 text-[0.9375rem] font-medium text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 sm:w-auto"
            >
              {t("exploreSolutions")}
            </Link>
            <StartProjectButton
              variant="secondary"
              className="h-12 w-full rounded-xl sm:w-auto"
            >
              {t("getInTouch")}
            </StartProjectButton>
          </motion.div>
        </div>

        <motion.div
          {...fadeUp(0.34, reduceMotion)}
          className="mt-10 border-t border-[#1E293B]/80 pt-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INDICATOR_KEYS.map((key) => (
              <Link
                key={key}
                href={indicatorHref(key, locale)}
                className="group rounded-xl border border-[#1E293B]/80 bg-[#050816]/45 px-4 py-3 backdrop-blur-sm transition-colors hover:border-[#2563EB]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
              >
                <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-white">
                  {t(`indicators.${key}.title`)}
                </p>
                <p className="mt-1 text-xs text-[#94A3B8] transition-colors group-hover:text-[#CBD5E1]">
                  {t(`indicators.${key}.subtitle`)}
                </p>
              </Link>
            ))}
            <Link
              href="#services"
              className="flex items-center rounded-xl border border-dashed border-[#1E293B] bg-[#050816]/30 px-4 py-3 text-sm font-medium text-[#60A5FA] transition-colors hover:border-[#2563EB]/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 sm:col-span-2 lg:col-span-1"
            >
              <span>{t("discoverLink")}</span>
              <span className="ml-2" aria-hidden>
                →
              </span>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}