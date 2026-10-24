"use client";

import { StartProjectButton } from "@/components/contact/StartProjectButton";
import { useTranslations } from "next-intl";

export function CTA() {
  const t = useTranslations("home.cta");

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="relative overflow-hidden px-6 py-24 sm:px-10 lg:px-16"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2563EB]/[0.06] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <h2
          id="contact-heading"
          className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl"
        >
          {t("title")}
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#94A3B8] sm:text-lg">
          {t("description")}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <div className="flex w-full flex-col gap-2 sm:w-auto">
            <StartProjectButton className="group w-full sm:w-auto">
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
            </StartProjectButton>
            <p className="text-xs text-[#64748B]">{t("ctaMicrocopy")}</p>
          </div>
          <a
            href="#services"
            className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#1E293B] bg-[#0E1324] px-8 text-[0.9375rem] font-medium text-white transition-all duration-300 hover:border-[#334155] hover:bg-[#0E1324]/80 sm:w-auto"
          >
            {t("viewServices")}
          </a>
        </div>
      </div>
    </section>
  );
}
