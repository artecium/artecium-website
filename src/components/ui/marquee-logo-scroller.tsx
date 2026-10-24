"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Technology, TechnologyIcon } from "@/data/technologies";

export type MarqueeSpeed = "slow" | "normal" | "fast";

const speedDurations: Record<MarqueeSpeed, string> = {
  slow: "90s",
  normal: "60s",
  fast: "40s",
};

export type MarqueeLogoScrollerProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  logos: Technology[];
  speed?: MarqueeSpeed;
  titleId?: string;
};

function BrandIcon({
  icon,
  className,
}: {
  icon: TechnologyIcon;
  className?: string;
}) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d={icon.path} />
    </svg>
  );
}

function LogoCard({
  name,
  icon,
  className = "",
}: Technology & { className?: string }) {
  return (
    <div
      aria-label={name}
      className={`group flex shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border border-[#1E293B] bg-[#0E1324] px-6 py-8 transition-all duration-300 hover:border-[#2563EB]/40 hover:bg-[#0E1324]/80 ${className}`}
    >
      <BrandIcon
        icon={icon}
        className="h-7 w-7 text-[#94A3B8] transition-colors duration-300 group-hover:text-white"
      />
      <span className="text-sm font-medium text-[#94A3B8] transition-colors duration-300 group-hover:text-white">
        {name}
      </span>
    </div>
  );
}

export function MarqueeLogoScroller({
  eyebrow,
  title,
  description,
  logos,
  speed = "normal",
  titleId,
}: MarqueeLogoScrollerProps) {
  const marqueeLogos = [...logos, ...logos];

  return (
    <div>
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        titleId={titleId}
      />

      {/* Animated marquee — hidden when user prefers reduced motion */}
      <div
        className="marquee-track relative mt-14 overflow-hidden motion-reduce:hidden"
        aria-label="Technologies we use"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#050816] to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#050816] to-transparent sm:w-24" />

        <div
          className="animate-marquee flex w-max gap-4"
          style={{ animationDuration: speedDurations[speed] }}
        >
          {marqueeLogos.map((logo, index) => (
            <LogoCard
              key={`${logo.name}-${index}`}
              {...logo}
              className="w-40 sm:w-44 lg:w-48"
            />
          ))}
        </div>
      </div>

      {/* Static grid fallback for prefers-reduced-motion */}
      <div
        className="mt-14 hidden grid-cols-2 gap-4 motion-reduce:grid sm:grid-cols-3 lg:grid-cols-4"
        aria-label="Technologies we use"
      >
        {logos.map((logo) => (
          <LogoCard key={logo.name} {...logo} className="w-full" />
        ))}
      </div>
    </div>
  );
}
