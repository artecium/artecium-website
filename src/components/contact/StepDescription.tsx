"use client";

import { useTranslations } from "next-intl";
import {
  WizardFooter,
  WizardStep,
  WizardTextarea,
} from "@/components/contact/WizardStep";
import type { UseProjectDiscoveryReturn } from "@/hooks/useProjectDiscovery";

interface StepDescriptionProps {
  wizard: UseProjectDiscoveryReturn;
}

export function StepDescription({ wizard }: StepDescriptionProps) {
  const t = useTranslations("discovery");
  const {
    data,
    updateField,
    continueStep,
    canContinue,
    direction,
    prev,
  } = wizard;

  return (
    <WizardStep
      headline={t("steps.description.headline")}
      subtitle={t("steps.description.subtitle")}
      direction={direction}
      footer={
        <WizardFooter
          onPrevious={prev}
          onContinue={continueStep}
          canContinue={canContinue()}
          showPrevious
        />
      }
    >
      <WizardTextarea
        id="discovery-description"
        label={t("steps.description.label")}
        placeholder={t("steps.description.placeholder")}
        value={data.description}
        onChange={(e) => updateField("description", e.target.value)}
      />
    </WizardStep>
  );
}
