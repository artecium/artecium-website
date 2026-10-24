"use client";

import { useWizard } from "@/hooks/useWizardContext";
import { useTranslations } from "next-intl";

interface NavbarStartProjectLinkProps {
  className?: string;
}

export function NavbarStartProjectLink({ className = "" }: NavbarStartProjectLinkProps) {
  const t = useTranslations("navigation");
  const { open } = useWizard();

  return (
    <button
      type="button"
      onClick={open}
      className={`text-sm text-[#94A3B8] transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 ${className}`}
    >
      {t("contact")}
    </button>
  );
}
