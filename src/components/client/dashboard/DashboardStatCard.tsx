import Link from "next/link";
import type { ReactNode } from "react";

interface DashboardStatCardProps {
  title: string;
  value: string;
  description?: string;
  href: string;
  icon: ReactNode;
}

export function DashboardStatCard({
  title,
  value,
  description,
  href,
  icon,
}: DashboardStatCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-[#1E293B] bg-[#0E1324] p-5 shadow-sm shadow-black/10 transition-[border-color,box-shadow,transform] duration-200 hover:border-[#2563EB]/30 hover:shadow-[#2563EB]/5 motion-safe:hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
            {value}
          </p>
          {description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#94A3B8]">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#1E293B] bg-[#050816]/80 text-[#60A5FA] transition-colors group-hover:border-[#2563EB]/25 group-hover:text-[#93C5FD]">
          {icon}
        </div>
      </div>
    </Link>
  );
}
