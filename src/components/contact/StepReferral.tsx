"use client";

import { useTranslations } from "next-intl";
import { OptionCard } from "@/components/contact/OptionCard";
import { WizardFooter, WizardStep } from "@/components/contact/WizardStep";
import type { UseProjectDiscoveryReturn } from "@/hooks/useProjectDiscovery";
import type { ReferralSource } from "@/types/project";

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
  const t = useTranslations("discovery");
  const { data, selectAndAdvance, isTransitioning, direction, prev } = wizard;

  return (
    <WizardStep
      headline={t("steps.referral.headline")}
      direction={direction}
      footer={<WizardFooter onPrevious={prev} showPrevious />}
    >
      <div
        role="radiogroup"
        aria-label={t("steps.referral.ariaLabel")}
        className="grid gap-3 sm:grid-cols-2"
      >
        {REFERRAL_OPTIONS.map((referral) => (
          <OptionCard
            key={referral}
            label={t(`referral.${referral}`)}
            selected={data.referral === referral}
            disabled={isTransitioning}
            onSelect={() => selectAndAdvance("referral", referral)}
          />
        ))}
      </div>
    </WizardStep>
  );
}
