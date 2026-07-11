"use client";

import { ProjectDiscoveryWizard } from "@/components/contact/ProjectDiscoveryWizard";
import { WizardProvider } from "@/hooks/useWizardContext";
import type { ReactNode } from "react";

export function WizardRoot({ children }: { children: ReactNode }) {
  return (
    <WizardProvider>
      {children}
      <ProjectDiscoveryWizard />
    </WizardProvider>
  );
}
