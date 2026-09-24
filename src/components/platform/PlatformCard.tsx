import Link from "next/link";
import type { ReactNode } from "react";

interface PlatformCardProps {
  title: string;
  description?: string;
  children?: ReactNode;
  href?: string;
}

export function PlatformCard({
  title,
  description,
  children,
  href,
}: PlatformCardProps) {
  const content = (
    <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6 transition-colors hover:border-[#2563EB]/20">
      <h3 className="text-base font-medium text-white">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
