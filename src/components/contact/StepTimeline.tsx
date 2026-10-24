"use client";

import { useTranslations } from "next-intl";
import { OptionCard } from "@/components/contact/OptionCard";
import { WizardFooter, WizardStep } from "@/components/contact/WizardStep";
import type { UseProjectDiscoveryReturn } from "@/hooks/useProjectDiscovery";
import type { Timeline } from "@/types/project";

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
  const t = useTranslations("discovery");
  const { data, selectAndAdvance, isTransitioning, direction, prev } = wizard;

  return (
    <WizardStep
      headline={t("steps.timeline.headline")}
      subtitle={t("steps.timeline.subtitle")}
      direction={direction}
      footer={<WizardFooter onPrevious={prev} showPrevious />}
    >
      <div
        role="radiogroup"
        aria-label={t("steps.timeline.ariaLabel")}
        className="grid gap-3 sm:grid-cols-2"
      >
        {TIMELINE_OPTIONS.map((timeline) => (
          <OptionCard
            key={timeline}
            label={t(`timeline.${timeline}`)}
            selected={data.timeline === timeline}
            disabled={isTransitioning}
            onSelect={() => selectAndAdvance("timeline", timeline)}
          />
        ))}
      </div>
    </WizardStep>
  );
}
