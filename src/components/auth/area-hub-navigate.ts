"use client";

import { clientAreaLinkTarget } from "@/lib/routing";

/** Mirrors ClientAreaNavLink + booking login targets without whole-card links. */
export function navigateAreaHubHref(
  router: { push: (href: string) => void },
  href: string,
  clientPortalLink: boolean,
): void {
  if (clientPortalLink) {
    const target = clientAreaLinkTarget(href, window.location.hostname);
    if (target.useFullNavigation) {
      window.location.assign(target.href);
      return;
    }
    router.push(target.href);
    return;
  }

  router.push(href);
}