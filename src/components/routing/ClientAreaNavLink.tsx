"use client";

import { clientAreaLinkTarget, isLocalDevHostname } from "@/lib/routing";
import Link from "next/link";
import { type ReactNode } from "react";

interface ClientAreaNavLinkProps {
  internalHref: string;
  className?: string;
  children: ReactNode;
}

/** Dev SSR has no `window`; assume document navigation matches local dev clients. */
function preferLocalDocumentNavigation(hostname: string): boolean {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "development";
  }
  return isLocalDevHostname(hostname);
}

export function ClientAreaNavLink({
  internalHref,
  className,
  children,
}: ClientAreaNavLinkProps) {
  const hostname =
    typeof window === "undefined" ? "" : window.location.hostname;

  if (preferLocalDocumentNavigation(hostname)) {
    return (
      <a href={internalHref} className={className}>
        {children}
      </a>
    );
  }

  const target =
    typeof window === "undefined"
      ? { href: internalHref, useFullNavigation: false as const }
      : clientAreaLinkTarget(internalHref, hostname);

  if (target.useFullNavigation) {
    return (
      <a href={target.href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={target.href} prefetch={false} className={className}>
      {children}
    </Link>
  );
}
