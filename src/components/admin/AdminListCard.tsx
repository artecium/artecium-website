import type { ReactNode } from "react";
import Link from "next/link";

interface AdminListCardProps {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  href?: string;
  children?: ReactNode;
}

export function AdminListCard({
  title,
  subtitle,
  meta,
  href,
  children,
}: AdminListCardProps) {
  const inner = (
    <div className="rounded-xl border border-[#1E293B] bg-[#050816]/40 px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-medium text-white">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-[#94A3B8]">{subtitle}</p> : null}
        </div>
        {meta ? <div className="shrink-0">{meta}</div> : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-90">
        {inner}
      </Link>
    );
  }

  return inner;
}
