"use client";

import { OptionCard } from "@/components/contact/OptionCard";
import { WizardFooter, WizardStep } from "@/components/contact/WizardStep";
import type { UseProjectDiscoveryReturn } from "@/hooks/useProjectDiscovery";

interface StepContactMethodProps {
  wizard: UseProjectDiscoveryReturn;
}

export function StepContactMethod({ wizard }: StepContactMethodProps) {
  const { data, selectContactMethod, direction, prev } = wizard;

  return (
    <WizardStep
      headline="Let's continue the conversation."
      subtitle="Choose the communication method that works best for you."
      direction={direction}
      footer={<WizardFooter onPrevious={prev} showPrevious />}
    >
      <div
        role="radiogroup"
        aria-label="Contact method"
        className="grid gap-4"
      >
        <OptionCard
          label="Continue by Email"
          description="We'll review your Discovery Brief and get back to you shortly."
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25V6.75m9 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 00-1.07-1.916l-7.5-4.615a2.25 2.25 0 00-2.36 0L3.32 8.91a2.25 2.25 0 00-1.07 1.916V19.5a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V6.75z" />
            </svg>
          }
          selected={data.contactMethod === "email"}
          onSelect={() => selectContactMethod("email")}
        />
        <OptionCard
          label="Continue on WhatsApp"
          description="Continue the conversation instantly with our team."
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          }
          selected={data.contactMethod === "whatsapp"}
          onSelect={() => selectContactMethod("whatsapp")}
        />
      </div>
    </WizardStep>
  );
}
