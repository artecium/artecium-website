"use client";

import { StartProjectButton } from "@/components/contact/StartProjectButton";

export function CTA() {
  return (
    <section
      id="contact"
      className="relative overflow-hidden px-6 py-24 sm:px-10 lg:px-16"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2563EB]/[0.06] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Ready to build something{" "}
          <span className="bg-gradient-to-r from-[#2563EB] to-[#60A5FA] bg-clip-text text-transparent">
            remarkable?
          </span>
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#94A3B8] sm:text-lg">
          Let&apos;s discuss your vision and craft a solution that transforms
          your business. No obligations — just a conversation about what&apos;s
          possible.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <StartProjectButton className="group w-full sm:w-auto">
            Start your project
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
          <StartProjectButton
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Book a call
          </StartProjectButton>
        </div>
      </div>
    </section>
  );
}
