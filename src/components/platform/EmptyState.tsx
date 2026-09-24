import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#1E293B] bg-[#0E1324]/50 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#1E293B] bg-[#050816] text-[#2563EB]">
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10.5 11.25V15.75M13.5 11.25V15.75M9 7.5V4.875c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V7.5"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#94A3B8]">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
