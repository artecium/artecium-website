import { SITE_URL } from "@/config/seo";
import {
  DEFAULT_PORTAL_HOSTNAME,
  internalClientPathToPublic,
  isPortalHostname,
  normalizePortalPathname,
  publicPortalPathToInternal,
  resolveRoutingHost,
  shouldUseExternalPortalNavigation,
} from "./portal-host";

const MAIN_SITE_ORIGIN = SITE_URL.replace(/\/$/, "");
const MAIN_SITE_ADMIN_DASHBOARD_URL = `${MAIN_SITE_ORIGIN}/admin/dashboard`;

/** Host header value for routing (local `Host` wins over forwarded production host). */
export function readRequestHostname(
  headerGet: (name: string) => string | null,
): string {
  return resolveRoutingHost(
    headerGet("host") ?? "",
    headerGet("x-forwarded-host"),
  );
}

/**
 * Same-origin href for a portal page: public paths on the portal host,
 * internal `/client/...` paths on the main site (legacy).
 */
export function clientAreaHref(internalPath: string, hostname: string): string {
  const normalized = normalizePortalPathname(internalPath);

  if (isPortalHostname(hostname)) {
    return internalClientPathToPublic(normalized) ?? normalized;
  }

  return normalized;
}

export type ClientAreaLinkTarget = {
  href: string;
  /** Use `<a>` / full document navigation (cross-origin main site → portal). */
  useFullNavigation: boolean;
};

/**
 * Browser link target for client area pages from the current host.
 * Production main site → absolute portal URL with full navigation.
 */
export function clientAreaLinkTarget(
  internalPath: string,
  hostname: string,
  nodeEnv?: string,
): ClientAreaLinkTarget {
  const normalized = normalizePortalPathname(internalPath);

  if (shouldUseExternalPortalNavigation(hostname, nodeEnv)) {
    return {
      href: portalAbsoluteHref(normalized),
      useFullNavigation: true,
    };
  }

  return {
    href: clientAreaHref(internalPath, hostname),
    useFullNavigation: false,
  };
}

/** Absolute URL on the dedicated portal subdomain (marketing / cross-site links). */
export function portalAbsoluteHref(internalPath: string): string {
  const normalized = normalizePortalPathname(internalPath);
  const publicPath =
    internalClientPathToPublic(normalized) ?? normalized;
  return `https://${DEFAULT_PORTAL_HOSTNAME}${publicPath}`;
}

/** Normalize browser pathname to internal `/client/...` for nav active-state matching. */
export function clientAreaPathnameForNavMatch(pathname: string): string {
  return publicPortalPathToInternal(pathname) ?? normalizePortalPathname(pathname);
}

/**
 * Browser post-login destination from internal role targets (`/client/dashboard`, `/admin/dashboard`).
 * Portal staff go to the main-site admin URL; portal clients use public portal paths.
 */
export function postLoginRedirectUrl(
  internalDestination: "/client/dashboard" | "/admin/dashboard",
  hostname: string,
): string {
  if (internalDestination === "/admin/dashboard") {
    if (isPortalHostname(hostname)) {
      return MAIN_SITE_ADMIN_DASHBOARD_URL;
    }
    return internalDestination;
  }

  return clientAreaHref("/client/dashboard", hostname);
}
