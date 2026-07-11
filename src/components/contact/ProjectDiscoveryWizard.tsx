"use client";

import { useEffect } from "react";
import { ProgressBar } from "@/components/contact/ProgressBar";
import { StepBudget } from "@/components/contact/StepBudget";
import { StepContactMethod } from "@/components/contact/StepContactMethod";
import { StepDescription } from "@/components/contact/StepDescription";
import { StepDiscoveryBrief } from "@/components/contact/StepDiscoveryBrief";
import { StepEmailSuccess } from "@/components/contact/StepEmailSuccess";
import { StepPersonalInfo } from "@/components/contact/StepPersonalInfo";
import { StepProjectType } from "@/components/contact/StepProjectType";
import { StepReferral } from "@/components/contact/StepReferral";
import { StepTimeline } from "@/components/contact/StepTimeline";
import { StepWhatsAppSuccess } from "@/components/contact/StepWhatsAppSuccess";
import { WizardModal } from "@/components/contact/WizardModal";
import { useProjectDiscovery } from "@/hooks/useProjectDiscovery";
import { useWizard } from "@/hooks/useWizardContext";

export function ProjectDiscoveryWizard() {
  const { isOpen, close } = useWizard();
  const wizard = useProjectDiscovery(close);

  const {
    step,
    phase,
    isTransitioning,
    totalSteps,
    continueStep,
    canContinue,
    close: closeWizard,
  } = wizard;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter") return;

      const target = event.target as HTMLElement;
      if (
        target.tagName === "TEXTAREA" ||
        (target.tagName === "BUTTON" && target.getAttribute("role") === "radio")
      ) {
        return;
      }

      if (phase === "steps" && [5, 6, 7].includes(step) && canContinue()) {
        event.preventDefault();
        continueStep();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, phase, step, canContinue, continueStep]);

  const renderStep = () => {
    if (phase === "email-success") {
      return <StepEmailSuccess wizard={wizard} />;
    }

    if (phase === "whatsapp-success") {
      return <StepWhatsAppSuccess wizard={wizard} />;
    }

    switch (step) {
      case 1:
        return <StepProjectType wizard={wizard} />;
      case 2:
        return <StepBudget wizard={wizard} />;
      case 3:
        return <StepTimeline wizard={wizard} />;
      case 4:
        return <StepReferral wizard={wizard} />;
      case 5:
        return <StepPersonalInfo wizard={wizard} />;
      case 6:
        return <StepDescription wizard={wizard} />;
      case 7:
        return <StepDiscoveryBrief wizard={wizard} />;
      case 8:
        return <StepContactMethod wizard={wizard} />;
      default:
        return null;
    }
  };

  const modalTitle =
    phase === "email-success" || phase === "whatsapp-success"
      ? "Discovery Brief"
      : "Project Discovery";

  const modalDescription =
    phase === "steps"
      ? "Let's understand your project"
      : "Your brief is ready";

  return (
    <WizardModal
      isOpen={isOpen}
      onClose={closeWizard}
      title={modalTitle}
      description={modalDescription}
    >
      {phase === "steps" && (
        <ProgressBar
          step={step}
          totalSteps={totalSteps}
          isTransitioning={isTransitioning}
        />
      )}

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {phase === "steps"
          ? `Step ${step} of ${totalSteps}`
          : "Discovery brief complete"}
      </div>

      {renderStep()}
    </WizardModal>
  );
}
