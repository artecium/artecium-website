"use client";

import { useTranslations } from "next-intl";
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
      headline={t("steps.personalInfo.headline")}
      subtitle={t("steps.personalInfo.subtitle")}
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
          label={t("steps.personalInfo.nameLabel")}
          type="text"
          autoComplete="name"
          placeholder={t("steps.personalInfo.namePlaceholder")}
          value={data.name}
          onChange={(e) => updateField("name", e.target.value)}
        />
        <WizardInput
          id="discovery-company"
          label={t("steps.personalInfo.companyLabel")}
          optional
          type="text"
          autoComplete="organization"
          placeholder={t("steps.personalInfo.companyPlaceholder")}
          value={data.company}
          onChange={(e) => updateField("company", e.target.value)}
        />
        <WizardInput
          id="discovery-email"
          label={t("steps.personalInfo.emailLabel")}
          type="email"
          autoComplete="email"
          placeholder={t("steps.personalInfo.emailPlaceholder")}
          value={data.email}
          onChange={(e) => updateField("email", e.target.value)}
        />
      </div>
    </WizardStep>
  );
}
