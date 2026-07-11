"use client";

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
      headline="Describe your project."
      subtitle="What problem are you trying to solve? What does success look like?"
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
        label="Project description"
        placeholder="Tell us about your idea..."
        value={data.description}
        onChange={(e) => updateField("description", e.target.value)}
      />
    </WizardStep>
  );
}
