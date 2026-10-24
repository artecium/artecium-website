"use client";

import { useTranslations } from "next-intl";
import { OptionCard } from "@/components/contact/OptionCard";
import { WizardFooter, WizardStep } from "@/components/contact/WizardStep";
import type { UseProjectDiscoveryReturn } from "@/hooks/useProjectDiscovery";
import type { BudgetRange } from "@/types/project";

const BUDGET_OPTIONS: BudgetRange[] = [
  "under-1000",
  "1000-3000",
  "3000-10000",
  "10000-plus",
];

interface StepBudgetProps {
  wizard: UseProjectDiscoveryReturn;
}

export function StepBudget({ wizard }: StepBudgetProps) {
  const t = useTranslations("discovery");
  const { data, selectAndAdvance, isTransitioning, direction, prev } = wizard;

  return (
    <WizardStep
      headline={t("steps.budget.headline")}
      subtitle={t("steps.budget.subtitle")}
      direction={direction}
      footer={<WizardFooter onPrevious={prev} showPrevious />}
    >
      <div
        role="radiogroup"
        aria-label={t("steps.budget.ariaLabel")}
        className="grid gap-3 sm:grid-cols-2"
      >
        {BUDGET_OPTIONS.map((budget) => (
          <OptionCard
            key={budget}
            label={t(`budget.${budget}`)}
            selected={data.budget === budget}
            disabled={isTransitioning}
            onSelect={() => selectAndAdvance("budget", budget)}
          />
        ))}
      </div>
    </WizardStep>
  );
}
