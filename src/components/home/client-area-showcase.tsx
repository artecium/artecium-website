"use client";

import { ClientDashboardBrowserFrame } from "@/components/home/client-dashboard-preview";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function ClientAreaShowcase() {
  const t = useTranslations("home.clientArea");

  return (
    <section
      id="client-area"
      aria-labelledby="client-area-heading"
      className="relative overflow-x-clip border-y border-[#1E293B]/60 bg-[#050816]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#2563EB]/[0.04] blur-[120px]" />
      </div>

      <ContainerScroll
        titleComponent={
          <div className="text-center">
            <p className="mb-4 text-sm font-medium tracking-widest text-[#2563EB] uppercase">
              {t("eyebrow")}
            </p>
            <h2
              id="client-area-heading"
              className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              {t("title")}
              <br />
              {t("titleLine2")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#94A3B8] sm:text-lg">
              {t("description")}
            </p>
            <Link
              href="/client/dashboard"
              className="mt-8 inline-flex h-11 items-center justify-center rounded-full border border-[#1E293B] bg-[#0E1324] px-6 text-sm font-medium text-white transition-all duration-300 hover:border-[#2563EB]/40 hover:bg-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
            >
              {t("exploreClientArea")}
            </Link>
          </div>
        }
      >
        <ClientDashboardBrowserFrame />
      </ContainerScroll>
    </section>
  );
}
