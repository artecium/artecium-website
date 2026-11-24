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
    "bg-accent text-foreground hover:bg-accent-hover focus-visible:ring-accent/40",
  secondary:
    "border border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-raised",
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
      className={`inline-flex h-12 items-center justify-center rounded-md px-8 text-[0.9375rem] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
