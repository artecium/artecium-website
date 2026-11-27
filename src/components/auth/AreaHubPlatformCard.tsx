"use client";

import { AreaHubCardPreviewViewport } from "@/components/auth/AreaHubCardPreviewViewport";
import { useReveal } from "@/hooks/useReveal";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { ReactNode, Ref } from "react";

export type AreaHubCardId = "client" | "booking";

export type AreaHubPlatformCardData = {
  cardId: AreaHubCardId;
  href: string;
  platformLabel: string;
  title: string;
  description: string;
  cta: string;
  visual: ReactNode;
  accent: "client" | "booking";
  cascadeDelayMs?: number;
  clientPortalLink?: boolean;
};

type AreaHubPlatformCardProps = AreaHubPlatformCardData & {
  isOpen: boolean;
  onOpen: () => void;
};

const accentStyles = {
  client: {
    glow: "hover:shadow-[0_28px_90px_rgba(37,99,235,0.18)]",
    bar: "from-[#2563EB]/80 via-[#2563EB]/20 to-transparent",
    icon: "text-[#60A5FA]",
    ring: "focus-visible:ring-[#2563EB]/60",
  },
  booking: {
    glow: "hover:shadow-[0_28px_90px_rgba(45,212,191,0.12)]",
    bar: "from-[#2DD4BF]/70 via-[#14B8A6]/15 to-transparent",
    icon: "text-[#5EEAD4]",
    ring: "focus-visible:ring-[#14B8A6]/50",
  },
} as const;

function ClientPlatformIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.25" stroke="currentColor" strokeWidth="1.25" />
      <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.25" stroke="currentColor" strokeWidth="1.25" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.25" stroke="currentColor" strokeWidth="1.25" />
      <rect x="11" y="11" width="6.5" height="6.5" rx="1.25" stroke="currentColor" strokeWidth="1.25" opacity="0.55" />
    </svg>
  );
}

function BookingPlatformIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.25" />
      <path d="M3 8h14" stroke="currentColor" strokeWidth="1.25" />
      <path d="M7 2.5v3M13 2.5v3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <rect x="6" y="10.5" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.35" />
      <rect x="11" y="10.5" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

export function areaHubLayoutId(cardId: AreaHubCardId): string {
  return `area-hub-card-${cardId}`;
}

export function areaHubPreviewLayoutId(cardId: AreaHubCardId): string {
  return `area-hub-preview-${cardId}`;
}

/** Collapsed grid card — opens overlay modal (does not grow in place). */
export function AreaHubPlatformCard({
  cardId,
  platformLabel,
  title,
  description,
  visual,
  accent,
  cascadeDelayMs = 0,
  isOpen,
  onOpen,
}: AreaHubPlatformCardProps) {
  const t = useTranslations("areaHub");
  const reduceMotion = useReducedMotion();
  const { ref, revealClass, transitionStyle } = useReveal({ cascadeDelayMs });
  const styles = accentStyles[accent];
  const Icon = accent === "client" ? ClientPlatformIcon : BookingPlatformIcon;
  const layoutId = areaHubLayoutId(cardId);
  const previewLayoutId = areaHubPreviewLayoutId(cardId);

  const hoverScale = reduceMotion ? undefined : 1.01;

  return (
    <motion.button
      ref={ref as Ref<HTMLButtonElement>}
      type="button"
      layoutId={layoutId}
      onClick={onOpen}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-label={`${t("expandHint")}: ${title}`}
      style={transitionStyle}
      aria-hidden={isOpen}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className={`group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#1E293B]/90 bg-[#0A0F1F]/80 text-left backdrop-blur-sm transition-[border-color,box-shadow] duration-500 hover:border-[#334155] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816] ${styles.glow} ${styles.ring} ${revealClass} ${isOpen ? "invisible" : ""}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${styles.bar}`}
        aria-hidden
      />

      <motion.div
        layoutId={previewLayoutId}
        className="relative w-full shrink-0 overflow-hidden border-b border-[#1E293B]/80 bg-[#050816] p-3 sm:p-4"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(37,99,235,0.08),transparent_65%)] opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
        <motion.div
          className="relative overflow-hidden rounded-xl border border-[#1E293B]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-transform duration-500"
          whileHover={reduceMotion ? undefined : { scale: hoverScale }}
        >
          <AreaHubCardPreviewViewport variant={accent}>
            {visual}
          </AreaHubCardPreviewViewport>
        </motion.div>
      </motion.div>

      <div className="flex flex-col p-5 sm:p-6 lg:p-7">
        <div className="mb-3 flex items-center gap-2.5">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-lg border border-[#1E293B] bg-[#050816]/60 ${styles.icon}`}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <p className="text-[11px] font-medium tracking-[0.18em] text-[#64748B] uppercase">{platformLabel}</p>
        </div>

        <motion.h2
          layoutId={`${layoutId}-title`}
          className="text-xl font-semibold tracking-tight text-white sm:text-2xl"
        >
          {title}
        </motion.h2>
        <motion.p
          layoutId={`${layoutId}-description`}
          className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#94A3B8] sm:text-[15px]"
        >
          {description}
        </motion.p>

        <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#60A5FA] opacity-90 transition-opacity group-hover:opacity-100">
          <span className="inline-block h-px w-5 bg-[#60A5FA]/60" aria-hidden />
          {t("expandHint")}
        </span>
      </div>
    </motion.button>
  );
}