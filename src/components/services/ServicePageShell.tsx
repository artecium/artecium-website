import { WizardRoot } from "@/components/contact/WizardRoot";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/Navbar";
import type { AppLocale } from "@/i18n/config";
import type { ReactNode } from "react";

interface ServicePageShellProps {
  children: ReactNode;
  locale: AppLocale;
}

export function ServicePageShell({ children, locale }: ServicePageShellProps) {
  return (
    <WizardRoot>
      <div className="flex min-h-full flex-1 flex-col bg-[#050816] font-sans text-white">
        <Navbar />
        <main id="main-content" className="pt-[5.75rem] sm:pt-[6.5rem]">
          {children}
        </main>
        <Footer locale={locale} />
      </div>
    </WizardRoot>
  );
}
