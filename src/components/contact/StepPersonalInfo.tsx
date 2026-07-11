"use client";

import {
  WizardFooter,
  WizardInput,
  WizardStep,
} from "@/components/contact/WizardStep";
import type { UseProjectDiscoveryReturn } from "@/hooks/useProjectDiscovery";

interface StepPersonalInfoProps {
  wizard: UseProjectDiscoveryReturn;
}

export function StepPersonalInfo({ wizard }: StepPersonalInfoProps) {
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
      headline="Tell us about yourself."
      subtitle="So we know who we're preparing this brief for."
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
      <div className="space-y-5">
        <WizardInput
          id="discovery-name"
          label="Name"
          type="text"
          autoComplete="name"
          placeholder="John Smith"
          value={data.name}
          onChange={(e) => updateField("name", e.target.value)}
        />
        <WizardInput
          id="discovery-company"
          label="Company"
          optional
          type="text"
          autoComplete="organization"
          placeholder="Acme Ltd."
          value={data.company}
          onChange={(e) => updateField("company", e.target.value)}
        />
        <WizardInput
          id="discovery-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="john@email.com"
          value={data.email}
          onChange={(e) => updateField("email", e.target.value)}
        />
      </div>
    </WizardStep>
  );
}
