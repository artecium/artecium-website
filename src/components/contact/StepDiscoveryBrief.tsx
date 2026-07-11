"use client";

import { DiscoveryBrief } from "@/components/contact/DiscoveryBrief";
import { WizardStep } from "@/components/contact/WizardStep";
import type { UseProjectDiscoveryReturn } from "@/hooks/useProjectDiscovery";

interface StepDiscoveryBriefProps {
  wizard: UseProjectDiscoveryReturn;
}

export function StepDiscoveryBrief({ wizard }: StepDiscoveryBriefProps) {
  const { data, goTo, next, direction } = wizard;

  return (
    <WizardStep
      headline="Discovery Brief"
      subtitle="Every great project starts with understanding your goals. This short briefing helps us prepare a more meaningful first conversation."
      direction={direction}
    >
      <DiscoveryBrief data={data} />

      <p className="mt-8 text-center text-sm text-[#94A3B8]">
        Does everything look correct?
      </p>

      <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => goTo(1)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#1E293B] bg-[#050816] px-5 py-2.5 text-sm font-medium text-[#94A3B8] transition-all duration-200 hover:border-[#334155] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Edit Project
        </button>

        <button
          type="button"
          onClick={next}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#2563EB] px-6 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-[#1D4ED8] hover:shadow-[0_0_24px_rgba(37,99,235,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
        >
          Continue
          <svg
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

    </WizardStep>
  );
}
