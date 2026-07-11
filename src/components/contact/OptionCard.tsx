"use client";

import type { ReactNode } from "react";

interface OptionCardProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
  icon?: ReactNode;
  description?: string;
  disabled?: boolean;
}

export function OptionCard({
  label,
  selected,
  onSelect,
  icon,
  description,
  disabled = false,
}: OptionCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 disabled:cursor-not-allowed disabled:opacity-60 sm:p-6 ${
        selected
          ? "border-[#2563EB]/50 bg-[#050816] shadow-[0_8px_40px_rgba(37,99,235,0.15)]"
          : "border-[#1E293B] bg-[#050816] hover:-translate-y-0.5 hover:border-[#2563EB]/30 hover:shadow-[0_8px_40px_rgba(37,99,235,0.1)]"
      }`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br transition-all duration-300 ${
          selected
            ? "from-[#2563EB]/10 to-transparent"
            : "from-[#2563EB]/0 to-transparent group-hover:from-[#2563EB]/5"
        }`}
      />

      <div className="relative flex items-start gap-4">
        {icon && (
          <div
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-[#0E1324] text-[#2563EB] transition-all duration-300 ${
              selected
                ? "border-[#2563EB]/40 shadow-[0_0_20px_rgba(37,99,235,0.15)]"
                : "border-[#1E293B] group-hover:border-[#2563EB]/30"
            }`}
          >
            {icon}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-base font-semibold text-white sm:text-[1.0625rem]">
              {label}
            </span>
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                selected
                  ? "border-[#2563EB] bg-[#2563EB]"
                  : "border-[#334155] bg-transparent"
              }`}
              aria-hidden="true"
            >
              {selected && (
                <span className="h-2 w-2 rounded-full bg-white" />
              )}
            </span>
          </div>
          {description && (
            <p className="mt-1.5 text-sm leading-relaxed text-[#94A3B8]">
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
