"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface SpinningBorderButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export default function SpinningBorderButton({
  children,
  className = "",
  ...props
}: SpinningBorderButtonProps) {
  return (
    <button
      type="button"
      className={`group relative inline-flex h-12 overflow-hidden rounded-full p-px text-[0.9375rem] font-medium text-white transition-shadow duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 hover:shadow-[0_0_32px_rgba(37,99,235,0.2)] ${className}`}
      {...props}
    >
      <span
        className="absolute inset-[-1000%] motion-safe:animate-spin motion-reduce:hidden"
        aria-hidden="true"
        style={{
          background:
            "conic-gradient(from 90deg at 50% 50%, #2563EB 0%, #60A5FA 50%, #2563EB 100%)",
        }}
      />
      <span
        className="absolute inset-px rounded-full border border-[#1E293B] motion-reduce:block motion-safe:hidden"
        aria-hidden="true"
      />
      <span className="relative inline-flex h-full w-full items-center justify-center rounded-full bg-[#0E1324] px-8 transition-colors duration-300 group-hover:bg-[#111827]">
        {children}
      </span>
    </button>
  );
}
