"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ServiceCardItem, ServiceCardsLabels } from "./types";

interface ServiceExpandableCardProps extends ServiceCardItem {
  labels: ServiceCardsLabels;
}

export function ServiceExpandableCard({
  id,
  imageSrc,
  imageAlt,
  title,
  intro,
  forWho,
  includes,
  ctaLabel,
  href,
  openDetailsAria,
  labels,
}: ServiceExpandableCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const layoutId = `service-card-${id}`;
  const imageLayoutId = `service-image-${id}`;

  const close = useCallback(() => setIsOpen(false), []);

  const open = useCallback(() => setIsOpen(true), []);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const closeButton = panel?.querySelector<HTMLElement>("[data-service-modal-close]");
    closeButton?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
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

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, close]);

  const hoverScale = reduceMotion ? undefined : 1.04;
  const transition = reduceMotion
    ? { duration: 0.01 }
    : { type: "spring" as const, stiffness: 320, damping: 32 };

  return (
    <>
      <motion.button
        type="button"
        layoutId={layoutId}
        onClick={open}
        aria-label={openDetailsAria}
        aria-haspopup="dialog"
        className="group relative h-72 w-full cursor-pointer overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0E1324] text-left shadow-sm transition-colors duration-300 hover:border-[#2563EB]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
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
          className="absolute inset-0 bg-gradient-to-t from-[#050816]/95 via-[#050816]/35 to-[#050816]/10 opacity-90 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden
        />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 sm:p-6">
          <motion.h3
            layoutId={`title-${layoutId}`}
            className="text-lg font-semibold tracking-tight text-white sm:text-xl"
          >
            {title}
          </motion.h3>
          <motion.p
            layoutId={`intro-${layoutId}`}
            className="line-clamp-2 text-sm leading-relaxed text-[#CBD5E1]"
          >
            {intro}
          </motion.p>
          <span
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#60A5FA] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
            aria-hidden
          >
            <span className="inline-block h-px w-6 bg-[#60A5FA]/60" />
            {labels.expandHint}
          </span>
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.25 }}
              className="absolute inset-0 bg-[#050816]/85 backdrop-blur-md"
              aria-label={labels.closeModalAria}
              onClick={close}
            />

            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              layoutId={layoutId}
              transition={transition}
              className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-[#1E293B] bg-[#0E1324] shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:max-h-[85vh] sm:rounded-2xl md:max-h-[80vh] md:flex-row"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                data-service-modal-close
                onClick={close}
                className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[#1E293B] bg-[#050816]/70 text-white backdrop-blur-sm transition-colors hover:border-[#2563EB]/40 hover:bg-[#0E1324] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                aria-label={labels.closeModalAria}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>

              <div className="relative h-52 w-full shrink-0 overflow-hidden sm:h-60 md:h-auto md:w-1/2 md:min-h-[420px]">
                <motion.img
                  layoutId={imageLayoutId}
                  src={imageSrc}
                  alt={imageAlt}
                  className="h-full w-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[#050816]/70 to-transparent md:hidden"
                  aria-hidden
                />
              </div>

              <div className="flex min-h-0 w-full flex-col overflow-y-auto p-6 sm:p-8 md:w-1/2">
                <p className="text-xs font-medium tracking-wide text-[#64748B] uppercase">
                  {labels.forWhoHeading}
                </p>
                <p className="mt-1 text-sm text-[#94A3B8]">{forWho}</p>

                <motion.h3
                  id={titleId}
                  layoutId={`title-${layoutId}`}
                  className="mt-4 border-b border-[#1E293B] pb-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl"
                >
                  {title}
                </motion.h3>

                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.12, duration: 0.3 }}
                  className="mt-5 space-y-6 text-sm leading-relaxed text-[#CBD5E1]"
                >
                  <p>{intro}</p>

                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {labels.includesHeading}
                    </h4>
                    <p className="mt-2 text-[#94A3B8]">{includes}</p>
                  </div>

                  <Link
                    href={href}
                    onClick={close}
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 rounded-sm"
                  >
                    {ctaLabel} →
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}