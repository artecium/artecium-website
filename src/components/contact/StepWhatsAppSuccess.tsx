"use client";

import { WizardFooter, WizardStep } from "@/components/contact/WizardStep";
import type { UseProjectDiscoveryReturn } from "@/hooks/useProjectDiscovery";
import { buildWhatsAppMessage, getWhatsAppUrl } from "@/lib/whatsapp";

interface StepWhatsAppSuccessProps {
  wizard: UseProjectDiscoveryReturn;
}

export function StepWhatsAppSuccess({ wizard }: StepWhatsAppSuccessProps) {
  const { data, direction, prev } = wizard;

  const handleOpenWhatsApp = () => {
    const message = buildWhatsAppMessage(data);
    const url = getWhatsAppUrl(message);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <WizardStep
      headline="Your Discovery Brief is ready."
      subtitle="Every successful project starts with a great conversation. We look forward to learning more about your business."
      direction={direction}
      footer={
        <WizardFooter
          onPrevious={prev}
          onContinue={handleOpenWhatsApp}
          continueLabel="Continue on WhatsApp"
          canContinue
          showPrevious
        />
      }
    >
      <div className="rounded-2xl border border-[#1E293B] bg-[#050816] p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2563EB]/30 bg-[#2563EB]/10 text-[#2563EB]">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </div>
        <p className="text-sm leading-relaxed text-[#94A3B8]">
          Your brief has been prepared. Continue on WhatsApp to start the conversation with our team.
        </p>
      </div>
    </WizardStep>
  );
}
