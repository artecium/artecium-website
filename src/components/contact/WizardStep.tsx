"use client";

import type { ReactNode } from "react";

interface WizardStepProps {
  headline: string;
  subtitle?: string;
  question?: string;
  children: ReactNode;
  direction?: "forward" | "backward";
  footer?: ReactNode;
}

export function WizardStep({
  headline,
  subtitle,
  question,
  children,
  direction = "forward",
  footer,
}: WizardStepProps) {
  return (
    <div
      className={
        direction === "forward" ? "animate-step-in" : "animate-step-in-reverse"
      }
    >
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {headline}
        </h2>
        {subtitle && (
          <p className="mt-3 max-w-lg text-base leading-relaxed text-[#94A3B8]">
            {subtitle}
          </p>
        )}
        {question && (
          <p className="mt-6 text-sm font-medium tracking-wide text-[#2563EB] uppercase">
            {question}
          </p>
        )}
      </div>

      <div>{children}</div>

      {footer && <div className="mt-8">{footer}</div>}
    </div>
  );
}

interface WizardFooterProps {
  onPrevious?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  canContinue?: boolean;
  showPrevious?: boolean;
  isLoading?: boolean;
}

export function WizardFooter({
  onPrevious,
  onContinue,
  continueLabel = "Continue",
  canContinue = true,
  showPrevious = true,
  isLoading = false,
}: WizardFooterProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[#1E293B]/60 pt-6">
      {showPrevious && onPrevious ? (
        <button
          type="button"
          onClick={onPrevious}
          className="inline-flex items-center gap-2 rounded-full border border-[#1E293B] bg-[#050816] px-5 py-2.5 text-sm font-medium text-[#94A3B8] transition-all duration-200 hover:border-[#334155] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </button>
      ) : (
        <div />
      )}

      {onContinue && (
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue || isLoading}
          className="group inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-6 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-[#1D4ED8] hover:shadow-[0_0_24px_rgba(37,99,235,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Please wait
            </>
          ) : (
            <>
              {continueLabel}
              <svg
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  );
}

export function WizardInput({
  id,
  label,
  optional,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-white">
        {label}
        {optional && (
          <span className="ml-1.5 font-normal text-[#94A3B8]">(optional)</span>
        )}
      </label>
      <input
        id={id}
        className="w-full rounded-xl border border-[#1E293B] bg-[#050816] px-4 py-3.5 text-white placeholder:text-[#94A3B8]/50 transition-all duration-200 focus:border-[#2563EB]/50 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
        {...props}
      />
    </div>
  );
}

export function WizardTextarea({
  id,
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-white">
        {label}
      </label>
      <textarea
        id={id}
        className="min-h-[160px] w-full resize-y rounded-xl border border-[#1E293B] bg-[#050816] px-4 py-3.5 text-white placeholder:text-[#94A3B8]/50 transition-all duration-200 focus:border-[#2563EB]/50 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
        {...props}
      />
    </div>
  );
}
