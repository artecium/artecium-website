"use client";

import { useWizard } from "@/hooks/useWizardContext";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface StartProjectButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
}

const variantClasses = {
  primary:
    "bg-[#2563EB] text-white hover:bg-[#1D4ED8] hover:shadow-[0_0_40px_rgba(37,99,235,0.35)]",
  secondary:
    "border border-[#1E293B] bg-[#0E1324] text-white hover:border-[#334155] hover:bg-[#0E1324]/80",
};

export function StartProjectButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: StartProjectButtonProps) {
  const { open } = useWizard();

  return (
    <button
      type="button"
      onClick={open}
      className={`inline-flex h-12 items-center justify-center rounded-full px-8 text-[0.9375rem] font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
