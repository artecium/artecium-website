/**
 * Portal subdomain routing helpers (client.artecium.com).
 *
 * Maps public portal URL paths (no `/client` prefix) to internal App Router
 * paths under `src/app/client/**`. Does not perform redirects or rewrites.
 */

/** Production portal host (hostname only, no port). */
export const DEFAULT_PORTAL_HOSTNAME = "client.artecium.com";

/** Marketing site hostname — keep aligned with `SITE_URL` in `config/seo`. */
export const PRODUCTION_MAIN_SITE_HOSTNAME = "artecium.com";

const CLIENT_PREFIX = "/client";

/** Top-level portal segments explicitly served under `/client/{segment}`. */
const PORTAL_TOP_LEVEL_SEGMENTS = [
  "dashboard",
  "projects",
  "services",
  "analytics",
  "seo",
  "reports",
  "payments",
  "invoices",
  "documents",
  "support",
  "notifications",
  "meetings",
  "feedback",
  "profile",
  "settings",
] as const;

type PortalTopLevelSegment = (typeof PORTAL_TOP_LEVEL_SEGMENTS)[number];

const TOP_LEVEL_SET = new Set<string>(PORTAL_TOP_LEVEL_SEGMENTS);

/** Public paths for Stripe checkout return (auth handled separately in proxy/layout). */
export const PORTAL_STRIPE_CHECKOUT_RETURN_PUBLIC_PATHS = [
  "/invoices/payment/success",
  "/invoices/payment/cancel",
] as const;

const STRIPE_RETURN_SET = new Set<string>(PORTAL_STRIPE_CHECKOUT_RETURN_PUBLIC_PATHS);

/**
 * Strip query and fragment, ensure leading slash, remove trailing slash (except `/`).
 */
export function normalizePortalPathname(pathnameOrPath: string): string {
  const withoutFragment = pathnameOrPath.split("#")[0] ?? pathnameOrPath;
  const withoutQuery = withoutFragment.split("?")[0] ?? withoutFragment;
  let path = withoutQuery.trim();

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  return path;
}

export function normalizeHostname(host: string): string {
  return host.split(":")[0]?.trim().toLowerCase() ?? "";
}

/**
 * Whether the HTTP host is the dedicated client portal subdomain.
 * Optional `expectedHostname` supports tests; defaults to {@link DEFAULT_PORTAL_HOSTNAME}.
 */
export function isPortalHostname(
  host: string,
  expectedHostname: string = DEFAULT_PORTAL_HOSTNAME,
): boolean {
  return normalizeHostname(host) === normalizeHostname(expectedHostname);
}

/**
 * Host for portal/proxy routing when `Host` and `X-Forwarded-Host` disagree.
 * Local browsers must not inherit a production forwarded host (avoids 308 → portal).
 */
export function resolveRoutingHost(
  hostHeader: string,
  forwardedHost: string | null | undefined,
  urlHostname = "",
): string {
  if (hostHeader && isLocalDevHostname(hostHeader)) {
    return hostHeader;
  }
  if (urlHostname && isLocalDevHostname(urlHostname)) {
    return hostHeader || urlHostname;
  }

  const forwarded = forwardedHost?.split(",")[0]?.trim() ?? "";
  return forwarded || hostHeader;
}

/** Local Next dev server — client routes stay on the same host (no portal 308). */
export function isLocalDevHostname(host: string): boolean {
  const raw = host.trim().toLowerCase();
  if (
    raw === "[::1]" ||
    raw.startsWith("[::1]:") ||
    raw === "::1" ||
    raw.startsWith("::1:")
  ) {
    return true;
  }
  const normalized = normalizeHostname(host);
  return normalized === "localhost" || normalized === "127.0.0.1";
}

/** Marketing site host (e.g. artecium.com) — `/client/*` redirects to portal subdomain in production. */
export function isProductionMainSiteHostname(host: string): boolean {
  const normalized = normalizeHostname(host);
  if (!normalized) return false;

  const mainHost = normalizeHostname(PRODUCTION_MAIN_SITE_HOSTNAME);
  return normalized === mainHost || normalized === `www.${mainHost}`;
}

/** Hosts that serve `/client/*` on the same origin (no cross-domain portal navigation). */
export function servesClientRoutesOnHost(host: string): boolean {
  if (isPortalHostname(host) || isLocalDevHostname(host)) {
    return true;
  }
  return !isProductionMainSiteHostname(host);
}

/**
 * Production marketing host → navigate to portal subdomain.
 * In `development`, always false so local dev works with hosts entries (e.g. artecium.com → 127.0.0.1).
 */
export function shouldUseExternalPortalNavigation(
  host: string,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  if (isLocalDevHostname(host)) {
    return false;
  }
  if (nodeEnv === "development") {
    return false;
  }
  return isProductionMainSiteHostname(host);
}

/** Portal root — future redirect target `/dashboard` (not implemented here). */
export function isPortalRootPublicPath(pathname: string): boolean {
  return normalizePortalPathname(pathname) === "/";
}

/** Shared login at `src/app/login` — not under `/client`. */
export function isPortalLoginPublicPath(pathname: string): boolean {
  return normalizePortalPathname(pathname) === "/login";
}

/**
 * Paths that must never be treated as portal app routes (main site, Next, API).
 */
export function isExcludedFromPortalRouting(pathname: string): boolean {
  const path = normalizePortalPathname(pathname);

  if (
    path.startsWith("/admin") ||
    path.startsWith("/api") ||
    path.startsWith("/_next")
  ) {
    return true;
  }

  return false;
}

export function isPortalStripeCheckoutReturnPublicPath(pathname: string): boolean {
  const path = normalizePortalPathname(pathname);
  return STRIPE_RETURN_SET.has(path);
}

/**
 * Map a public portal pathname to an internal `/client/...` pathname.
 * Returns `null` when the path is not an explicit portal app route.
 */
export function publicPortalPathToInternal(pathname: string): string | null {
  const path = normalizePortalPathname(pathname);

  if (
    path === "/" ||
    path === "/login" ||
    isExcludedFromPortalRouting(path)
  ) {
    return null;
  }

  if (path.startsWith(`${CLIENT_PREFIX}/`) || path === CLIENT_PREFIX) {
    return null;
  }

  const projectsMatch = path.match(/^\/projects\/([^/]+)$/);
  if (projectsMatch) {
    return `${CLIENT_PREFIX}/projects/${projectsMatch[1]}`;
  }

  if (STRIPE_RETURN_SET.has(path)) {
    return `${CLIENT_PREFIX}${path}`;
  }

  const segment = path.slice(1);
  if (!segment.includes("/") && TOP_LEVEL_SET.has(segment)) {
    return `${CLIENT_PREFIX}/${segment}`;
  }

  return null;
}

/**
 * Map an internal `/client/...` pathname to the public portal pathname.
 * Returns `null` for paths outside the explicit portal route set.
 */
export function internalClientPathToPublic(pathname: string): string | null {
  const path = normalizePortalPathname(pathname);

  if (!path.startsWith(`${CLIENT_PREFIX}/`) && path !== CLIENT_PREFIX) {
    return null;
  }

  if (path === CLIENT_PREFIX) {
    return null;
  }

  const suffix = path.slice(CLIENT_PREFIX.length);
  const publicPath = suffix.startsWith("/") ? suffix : `/${suffix}`;

  if (publicPortalPathToInternal(publicPath) === path) {
    return publicPath;
  }

  return null;
}

/**
 * Public portal paths that map to `/client/**` and require authentication
 * (excluding `/login`, `/`, and Stripe return URLs).
 */
export function isPortalProtectedPublicPath(pathname: string): boolean {
  const path = normalizePortalPathname(pathname);

  if (
    path === "/" ||
    path === "/login" ||
    isExcludedFromPortalRouting(path) ||
    isPortalStripeCheckoutReturnPublicPath(path)
  ) {
    return false;
  }

  return publicPortalPathToInternal(path) !== null;
}

/** Whether the pathname is any recognized public portal app route (including Stripe returns). */
export function isRecognizedPortalPublicAppPath(pathname: string): boolean {
  return publicPortalPathToInternal(pathname) !== null;
}

export function listPortalTopLevelSegments(): readonly PortalTopLevelSegment[] {
  return PORTAL_TOP_LEVEL_SEGMENTS;
}

/**
 * Same-host redirect target on the portal subdomain (public paths when mapped).
 * Used after login and for non-staff admin bounce — does not emit cross-host URLs.
 */
export function portalSameHostRedirectPathname(internalPath: string): string {
  return internalClientPathToPublic(internalPath) ?? internalPath;
}
