"use client";

import { OptionCard } from "@/components/contact/OptionCard";
import { WizardFooter, WizardStep } from "@/components/contact/WizardStep";
import type { UseProjectDiscoveryReturn } from "@/hooks/useProjectDiscovery";
import { TIMELINE_LABELS, type Timeline } from "@/types/project";

const TIMELINE_OPTIONS: Timeline[] = [
  "asap",
  "within-30-days",
  "1-3-months",
  "just-exploring",
];

interface StepTimelineProps {
  wizard: UseProjectDiscoveryReturn;
}

export function StepTimeline({ wizard }: StepTimelineProps) {
  const { data, selectAndAdvance, isTransitioning, direction, prev } = wizard;

  return (
    <WizardStep
      headline="When would you like to start?"
      subtitle="Understanding your timeline helps us plan the right discovery process."
      direction={direction}
      footer={<WizardFooter onPrevious={prev} showPrevious />}
    >
      <div
        role="radiogroup"
        aria-label="Project timeline"
        className="grid gap-3 sm:grid-cols-2"
      >
        {TIMELINE_OPTIONS.map((timeline) => (
          <OptionCard
            key={timeline}
            label={TIMELINE_LABELS[timeline]}
            selected={data.timeline === timeline}
            disabled={isTransitioning}
            onSelect={() => selectAndAdvance("timeline", timeline)}
          />
        ))}
      </div>
    </WizardStep>
  );
}
