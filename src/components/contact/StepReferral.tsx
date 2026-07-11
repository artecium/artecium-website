"use client";

import { OptionCard } from "@/components/contact/OptionCard";
import { WizardFooter, WizardStep } from "@/components/contact/WizardStep";
import type { UseProjectDiscoveryReturn } from "@/hooks/useProjectDiscovery";
import { REFERRAL_LABELS, type ReferralSource } from "@/types/project";

const REFERRAL_OPTIONS: ReferralSource[] = [
  "google",
  "linkedin",
  "instagram",
  "referral",
  "friend",
  "other",
];

interface StepReferralProps {
  wizard: UseProjectDiscoveryReturn;
}

export function StepReferral({ wizard }: StepReferralProps) {
  const { data, selectAndAdvance, isTransitioning, direction, prev } = wizard;

  return (
    <WizardStep
      headline="How did you hear about Artecium?"
      direction={direction}
      footer={<WizardFooter onPrevious={prev} showPrevious />}
    >
      <div
        role="radiogroup"
        aria-label="Referral source"
        className="grid gap-3 sm:grid-cols-2"
      >
        {REFERRAL_OPTIONS.map((referral) => (
          <OptionCard
            key={referral}
            label={REFERRAL_LABELS[referral]}
            selected={data.referral === referral}
            disabled={isTransitioning}
            onSelect={() => selectAndAdvance("referral", referral)}
          />
        ))}
      </div>
    </WizardStep>
  );
}
