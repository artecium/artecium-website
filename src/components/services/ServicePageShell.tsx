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
      <div className="flex min-h-full flex-1 flex-col bg-background font-sans text-foreground">
        <Navbar />
        <main id="main-content">{children}</main>
        <Footer locale={locale} />
      </div>
    </WizardRoot>
  );
}
