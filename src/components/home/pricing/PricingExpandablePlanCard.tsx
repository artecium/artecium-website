"use client";

import { StartProjectButton } from "@/components/contact/StartProjectButton";
import {
  PRICING_CATEGORY_IMAGES,
  pricingImageAltKey,
} from "@/lib/pricing/images";
import type { PricingCategory } from "@/lib/pricing/config";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef } from "react";

interface PricingExpandablePlanCardProps {
  category: PricingCategory;
  planKey: string;
  featured?: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export function PricingExpandablePlanCard({
  category,
  planKey,
  featured = false,
  isOpen,
  onOpen,
  onClose,
}: PricingExpandablePlanCardProps) {
  const t = useTranslations("home.pricing");
  const baseKey = `categories.${category}.plans.${planKey}`;
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const layoutId = `pricing-plan-${category}-${planKey}`;
  const imageLayoutId = `pricing-image-${category}-${planKey}`;

  const setupLabel =
    category === "booking" ? t("labels.setupBooking") : t("labels.setup");
  const name = t(`${baseKey}.name`);
  const description = t(`${baseKey}.description`);
  const setupPrice = t(`${baseKey}.setupPrice`);
  const monthlyPrice = t(`${baseKey}.monthlyPrice`);
  const monthlyNote = t.has(`${baseKey}.monthlyNote`)
    ? t(`${baseKey}.monthlyNote`)
    : null;
  const commercialLimit = t.has(`${baseKey}.commercialLimit`)
    ? t(`${baseKey}.commercialLimit`)
    : null;
  const ctaKey = t(`${baseKey}.ctaKey`) as "choosePlan" | "requestQuote";
  const cta = t(`cta.${ctaKey}`);
  const features = t.raw(`${baseKey}.features`) as string[];
  const imageSrc = PRICING_CATEGORY_IMAGES[category];
  const imageAlt = t(pricingImageAltKey(category));
  const monthlyDisplay =
    monthlyNote === "noMonthly"
      ? t("labels.monthlyOptionalNone")
      : monthlyPrice;

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    panel
      ?.querySelector<HTMLElement>("[data-pricing-modal-close]")
      ?.focus();

  const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const elements = panel.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])',
      );
      const focusable = Array.from(elements).filter(
        (el) => !el.hasAttribute("disabled"),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, close]);

  const transition = reduceMotion
    ? { duration: 0.01 }
    : { type: "spring" as const, stiffness: 320, damping: 32 };

  const hoverScale = reduceMotion ? undefined : 1.04;
  const showExternalNote = category === "aiAutomation";

  return (
    <>
      <motion.button
        type="button"
        layoutId={layoutId}
        onClick={onOpen}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`${t("labels.expandHint")}: ${name}`}
        className={`group relative h-[22rem] w-full cursor-pointer overflow-hidden rounded-2xl border bg-[#0E1324] text-left shadow-sm transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 sm:h-80 ${
          featured
            ? "border-[#2563EB]/45 hover:border-[#2563EB]/55"
            : "border-[#1E293B] hover:border-[#2563EB]/35"
        }`}
        whileHover={reduceMotion ? undefined : "hover"}
      >
        <motion.img
          layoutId={imageLayoutId}
          src={imageSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          variants={{ hover: { scale: hoverScale ?? 1 } }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#050816]/98 via-[#050816]/55 to-[#050816]/15"
          aria-hidden
        />

        {featured ? (
          <span className="absolute top-4 left-4 z-10 rounded-full border border-[#2563EB]/35 bg-[#050816]/80 px-3 py-1 text-[0.625rem] font-semibold tracking-wide text-[#60A5FA] uppercase backdrop-blur-sm">
            {t("popularBadge")}
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 p-5 sm:p-6">
          <motion.h3
            layoutId={`title-${layoutId}`}
            className="text-lg font-semibold tracking-tight text-white"
          >
            {name}
          </motion.h3>
          <motion.p
            layoutId={`intro-${layoutId}`}
            className="line-clamp-2 text-sm leading-relaxed text-[#CBD5E1]"
          >
            {description}
          </motion.p>

          <div className="mt-2 grid grid-cols-2 gap-3 text-left">
            <div>
              <p className="text-[0.625rem] font-semibold tracking-[0.14em] text-[#64748B] uppercase">
                {setupLabel}
              </p>
              <p className="mt-0.5 text-base font-semibold text-white">
                {setupPrice}
              </p>
              <p className="text-[0.6875rem] text-[#64748B]">
                {t("labels.setupOnce")}
              </p>
            </div>
            <div>
              <p className="text-[0.625rem] font-semibold tracking-[0.14em] text-[#64748B] uppercase">
                {t("labels.monthly")}
              </p>
              <p className="mt-0.5 text-sm font-medium text-[#CBD5E1]">
                {monthlyDisplay}
              </p>
              {monthlyNote !== "noMonthly" ? (
                <p className="text-[0.6875rem] text-[#64748B]">
                  {t("labels.monthlyRecurring")}
                </p>
              ) : null}
            </div>
          </div>

          <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#60A5FA] opacity-80 transition-opacity group-hover:opacity-100">
            <span className="inline-block h-px w-5 bg-[#60A5FA]/60" aria-hidden />
            {t("labels.expandHint")}
          </span>
        </div>
      </motion.button>

      <AnimatePresence mode="wait">
        {isOpen ? (
          <div className="fixed inset-0 z-[68] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.22 }}
              className="absolute inset-0 bg-[#050816]/85 backdrop-blur-md"
              aria-label={t("labels.closeModal")}
              onClick={close}
            />

            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              layoutId={layoutId}
              transition={transition}
              className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-[#1E293B] bg-[#0E1324] shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:max-h-[88vh] sm:rounded-2xl md:max-h-[85vh] md:flex-row"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                data-pricing-modal-close
                onClick={close}
                className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[#1E293B] bg-[#050816]/70 text-white backdrop-blur-sm transition-colors hover:border-[#2563EB]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                aria-label={t("labels.closeModal")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>

              <div className="relative h-48 w-full shrink-0 overflow-hidden sm:h-56 md:h-auto md:w-[42%] md:min-h-[440px]">
                <motion.img
                  layoutId={imageLayoutId}
                  src={imageSrc}
                  alt={imageAlt}
                  className="h-full w-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[#050816]/75 to-transparent md:hidden"
                  aria-hidden
                />
              </div>

              <div className="flex min-h-0 w-full flex-col overflow-y-auto p-6 sm:p-8 md:w-[58%]">
                {featured ? (
                  <span className="mb-3 inline-flex w-fit rounded-full border border-[#2563EB]/35 bg-[#2563EB]/10 px-3 py-1 text-[0.625rem] font-semibold tracking-wide text-[#60A5FA] uppercase">
                    {t("popularBadge")}
                  </span>
                ) : null}

                <motion.h3
                  id={titleId}
                  layoutId={`title-${layoutId}`}
                  className="text-2xl font-semibold tracking-tight text-white sm:text-3xl"
                >
                  {name}
                </motion.h3>
                <motion.p
                  layoutId={`intro-${layoutId}`}
                  className="mt-3 text-sm leading-relaxed text-[#94A3B8]"
                >
                  {description}
                </motion.p>

                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.1, duration: 0.28 }}
                  className="mt-6 grid gap-4 border-y border-[#1E293B]/80 py-5 sm:grid-cols-2"
                >
                  <div>
                    <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[#64748B] uppercase">
                      {setupLabel}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {setupPrice}
                    </p>
                    <p className="mt-1 text-xs text-[#64748B]">
                      {t("labels.setupOnce")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[#64748B] uppercase">
                      {t("labels.monthly")}
                    </p>
                    <p className="mt-1 text-xl font-medium text-[#CBD5E1]">
                      {monthlyDisplay}
                    </p>
                    {monthlyNote !== "noMonthly" ? (
                      <p className="mt-1 text-xs text-[#64748B]">
                        {t("labels.monthlyRecurring")}
                      </p>
                    ) : null}
                  </div>
                </motion.div>

                {commercialLimit ? (
                  <p className="mt-4 text-sm text-[#94A3B8]">
                    <span className="font-medium text-white">
                      {t("labels.commercialLimit")}:
                    </span>{" "}
                    {commercialLimit}
                  </p>
                ) : null}

                <motion.div
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: reduceMotion ? 0 : 0.14 }}
                  className="mt-6"
                >
                  <h4 className="text-sm font-semibold text-white">
                    {t("labels.featuresHeading")}
                  </h4>
                  <ul className="mt-3 space-y-2.5">
                    {features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-[#94A3B8]"
                      >
                        <span className="mt-1 text-[#2563EB]" aria-hidden>
                          ✓
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {showExternalNote ? (
                  <p className="mt-5 text-xs leading-relaxed text-[#64748B]">
                    {t("categoryNotes.aiAutomation")}
                  </p>
                ) : null}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <StartProjectButton
                    variant={featured ? "primary" : "secondary"}
                    className="w-full rounded-xl sm:w-auto sm:min-w-[200px]"
                  >
                    {cta}
                  </StartProjectButton>
                  <button
                    type="button"
                    onClick={close}
                    className="text-sm font-medium text-[#64748B] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                  >
                    {t("labels.closeModal")}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}