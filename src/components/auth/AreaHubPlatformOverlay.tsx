"use client";

import { AreaHubModalPreviewViewport } from "@/components/auth/AreaHubModalPreviewViewport";
import { AreaHubSlideToEnter } from "@/components/auth/AreaHubSlideToEnter";
import {
  areaHubLayoutId,
  areaHubPreviewLayoutId,
  type AreaHubPlatformCardData,
} from "@/components/auth/AreaHubPlatformCard";
import { navigateAreaHubHref } from "@/components/auth/area-hub-navigate";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef } from "react";

const accentStyles = {
  client: {
    bar: "from-[#2563EB]/80 via-[#2563EB]/20 to-transparent",
    border: "border-[#2563EB]/35",
  },
  booking: {
    bar: "from-[#2DD4BF]/70 via-[#14B8A6]/15 to-transparent",
    border: "border-[#14B8A6]/30",
  },
} as const;

interface AreaHubPlatformOverlayProps {
  platform: AreaHubPlatformCardData;
  onClose: () => void;
}

export function AreaHubPlatformOverlay({ platform, onClose }: AreaHubPlatformOverlayProps) {
  const t = useTranslations("areaHub");
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const styles = accentStyles[platform.accent];
  const layoutId = areaHubLayoutId(platform.cardId);
  const previewLayoutId = areaHubPreviewLayoutId(platform.cardId);

  const handleConfirm = useCallback(() => {
    navigateAreaHubHref(router, platform.href, platform.clientPortalLink ?? false);
  }, [platform.clientPortalLink, platform.href, router]);

  const slideAriaLabel = `${platform.cta}. ${t("slideToConfirmHint")}`;

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("[data-area-hub-close]")?.focus();

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
      const focusable = Array.from(elements).filter((el) => !el.hasAttribute("disabled"));
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
  }, [close]);

  const transition = reduceMotion
    ? { duration: 0.01 }
    : { type: "spring" as const, stiffness: 320, damping: 32 };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4">
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.22 }}
        className="absolute inset-0 bg-[#050816]/85 backdrop-blur-md"
        aria-label={t("closeModalAria")}
        onClick={close}
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        layoutId={layoutId}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition}
        onClick={(event) => event.stopPropagation()}
        className={`relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border bg-[#0A0F1F]/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-sm ${styles.border} max-h-[calc(100dvh-1rem)] sm:max-h-[min(36rem,calc(100dvh-2rem))]`}
      >
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${styles.bar}`}
          aria-hidden
        />

        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#1E293B]/70 px-4 py-3 sm:px-5">
          <p className="text-[10px] font-medium tracking-[0.18em] text-[#64748B] uppercase sm:text-[11px]">
            {platform.platformLabel}
          </p>
          <button
            type="button"
            data-area-hub-close
            onClick={close}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#1E293B] bg-[#050816]/70 text-white backdrop-blur-sm transition-colors hover:border-[#334155] hover:bg-[#0E1324] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
            aria-label={t("closeModalAria")}
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
        </header>

        <motion.div
          layoutId={previewLayoutId}
          className="shrink-0 overflow-hidden border-b border-[#1E293B]/80 bg-[#050816] px-3 py-2.5 sm:px-4 sm:py-3"
        >
          <div className="overflow-hidden rounded-xl border border-[#1E293B]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <AreaHubModalPreviewViewport variant={platform.accent}>
              {platform.visual}
            </AreaHubModalPreviewViewport>
          </div>
        </motion.div>

        <div className="flex min-h-0 flex-1 flex-col justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <div className="min-h-0">
            <motion.h2
              id={titleId}
              layoutId={`${layoutId}-title`}
              className="text-lg font-semibold tracking-tight text-white sm:text-2xl"
            >
              {platform.title}
            </motion.h2>
            <motion.p
              layoutId={`${layoutId}-description`}
              className="mt-2 line-clamp-2 text-sm leading-snug text-[#94A3B8] sm:line-clamp-3 sm:leading-relaxed"
            >
              {platform.description}
            </motion.p>
          </div>

          <div
            data-slide-enter
            className="flex shrink-0 flex-col gap-3 border-t border-[#1E293B]/70 pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-4"
          >
            <span className="text-sm font-medium leading-snug text-white sm:max-w-[52%]">
              {platform.cta}
            </span>
            <AreaHubSlideToEnter
              accent={platform.accent}
              ariaLabel={slideAriaLabel}
              hint={t("slideToConfirmHint")}
              onConfirm={handleConfirm}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}