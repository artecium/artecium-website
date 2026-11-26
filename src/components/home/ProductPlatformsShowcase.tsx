"use client";

import { BookingDashboardBrowserFrame } from "@/components/home/booking-dashboard-preview";
import { ClientDashboardBrowserFrame } from "@/components/home/client-dashboard-preview";
import { useReveal } from "@/hooks/useReveal";
import Link from "next/link";
import type { ReactNode } from "react";

export type ProductPlatformCardProps = {
  href: string;
  title: string;
  description: string;
  cta: string;
  visual: ReactNode;
  cascadeDelayMs?: number;
};

function PlatformCard({
  href,
  title,
  description,
  cta,
  visual,
  cascadeDelayMs = 0,
}: ProductPlatformCardProps) {
  const { ref, revealClass, transitionStyle } = useReveal({ cascadeDelayMs });

  return (
    <article
      ref={ref}
      style={transitionStyle}
      className={`${revealClass} flex h-full flex-col overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0E1324]/90 transition-colors duration-300 hover:border-[#2563EB]/35`}
    >
      <div className="relative aspect-[16/11] w-full overflow-hidden border-b border-[#1E293B] bg-[#050816] p-3 sm:aspect-[16/10] sm:p-4">
        <div className="h-full min-h-[200px] overflow-hidden rounded-lg border border-[#1E293B]/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          {visual}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-[#94A3B8] sm:text-base">
          {description}
        </p>
        <Link
          href={href}
          className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#2563EB] px-5 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 sm:w-auto sm:min-w-[220px]"
        >
          {cta}
        </Link>
      </div>
    </article>
  );
}

type ProductPlatformsShowcaseProps = {
  eyebrow: string;
  heading: string;
  subheading: string;
  srNav: string;
  titleId: string;
  clientHref: string;
  bookingHref: string;
  clientTitle: string;
  clientDescription: string;
  clientCta: string;
  bookingTitle: string;
  bookingDescription: string;
  bookingCta: string;
};

export function ProductPlatformsShowcase({
  eyebrow,
  heading,
  subheading,
  srNav,
  titleId,
  clientHref,
  bookingHref,
  clientTitle,
  clientDescription,
  clientCta,
  bookingTitle,
  bookingDescription,
  bookingCta,
}: ProductPlatformsShowcaseProps) {
  const { ref, revealClass, transitionStyle } = useReveal();

  return (
    <section
      id="platforms"
      aria-labelledby={titleId}
      className="relative overflow-hidden border-y border-[#1E293B]/60 bg-[#050816] px-6 py-20 sm:px-10 lg:px-16 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div
          ref={ref}
          style={transitionStyle}
          className={`${revealClass} mx-auto max-w-3xl text-center`}
        >
          <p className="text-sm font-medium tracking-[0.2em] text-[#2563EB] uppercase">
            {eyebrow}
          </p>
          <h2
            id={titleId}
            className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]"
          >
            {heading}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#94A3B8] sm:text-lg">
            {subheading}
          </p>
        </div>

        <h3 className="sr-only">{srNav}</h3>
        <div className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-2 lg:gap-8">
          <PlatformCard
            href={clientHref}
            title={clientTitle}
            description={clientDescription}
            cta={clientCta}
            visual={<ClientDashboardBrowserFrame />}
            cascadeDelayMs={80}
          />
          <PlatformCard
            href={bookingHref}
            title={bookingTitle}
            description={bookingDescription}
            cta={bookingCta}
            visual={<BookingDashboardBrowserFrame />}
            cascadeDelayMs={160}
          />
        </div>
      </div>
    </section>
  );
}