/**
 * Booking subdomain routing (`booking.artecium.com`).
 *
 * Public: `/{business-slug}` → internal `/booking/b/{slug}`
 * Private admin: `/dashboard`, `/calendar`, … → `/booking/admin/...`
 */

export const DEFAULT_BOOKING_HOSTNAME = "booking.artecium.com";

const ADMIN_PREFIX = "/booking/admin";
const PUBLIC_PREFIX = "/booking/b";

/** Single-segment admin paths on the booking host (public URL without prefix). */
export const BOOKING_ADMIN_PUBLIC_SEGMENTS = [
  "dashboard",
  "onboarding",
  "calendar",
  "services",
  "staff",
  "schedules",
  "time-off",
  "customers",
  "appointments",
  "settings",
  "team",
  "notifications",
  "profile",
] as const;

const ADMIN_SEGMENT_SET = new Set<string>(BOOKING_ADMIN_PUBLIC_SEGMENTS);

/** Slugs that cannot be registered as business slugs (mirror admin + infra). */
export const BOOKING_RESERVED_SLUGS = new Set<string>([
  ...BOOKING_ADMIN_PUBLIC_SEGMENTS,
  "login",
  "api",
  "_next",
  "admin",
  "b",
  "booking",
  "en",
  "static",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export function normalizeBookingPathname(pathnameOrPath: string): string {
  const withoutFragment = pathnameOrPath.split("#")[0] ?? pathnameOrPath;
  const withoutQuery = withoutFragment.split("?")[0] ?? withoutFragment;
  let path = withoutQuery.trim();
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

export function isBookingHostname(
  host: string,
  expectedHostname: string = DEFAULT_BOOKING_HOSTNAME,
): boolean {
  const hostname = host.split(":")[0]?.trim().toLowerCase() ?? "";
  return hostname === expectedHostname.toLowerCase();
}

export function isBookingLoginPublicPath(pathname: string): boolean {
  return normalizeBookingPathname(pathname) === "/login";
}

export function isBookingAdminPublicPath(pathname: string): boolean {
  const path = normalizeBookingPathname(pathname);
  if (path === "/") return true;
  const segment = path.slice(1).split("/")[0] ?? "";
  return ADMIN_SEGMENT_SET.has(segment);
}

export function isBookingProtectedAdminPath(pathname: string): boolean {
  const path = normalizeBookingPathname(pathname);
  if (path === "/" || path === "/login") return false;
  if (!isBookingAdminPublicPath(path)) return false;
  return path !== "/login";
}

export function isValidBusinessSlug(slug: string): boolean {
  const trimmed = slug.trim();
  if (trimmed !== trimmed.toLowerCase()) return false;
  if (!trimmed || BOOKING_RESERVED_SLUGS.has(trimmed)) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed);
}

/**
 * Map booking-host public pathname to internal App Router path.
 * Returns null when the path should not be rewritten (e.g. `/login`, `/api`).
 */
export function bookingPublicPathToInternal(pathname: string): string | null {
  const path = normalizeBookingPathname(pathname);

  if (
    path === "/login" ||
    path.startsWith("/api") ||
    path.startsWith("/_next")
  ) {
    return null;
  }

  if (path === "/") {
    return `${ADMIN_PREFIX}/dashboard`;
  }

  const segments = path.slice(1).split("/");
  const first = segments[0] ?? "";

  if (ADMIN_SEGMENT_SET.has(first)) {
    const rest = segments.slice(1).join("/");
    return rest ? `${ADMIN_PREFIX}/${first}/${rest}` : `${ADMIN_PREFIX}/${first}`;
  }

  if (segments.length >= 1 && first && isValidBusinessSlug(first)) {
    const rest = segments.slice(1).join("/");
    const slug = first.toLowerCase();
    return rest ? `${PUBLIC_PREFIX}/${slug}/${rest}` : `${PUBLIC_PREFIX}/${slug}`;
  }

  return null;
}

export function bookingInternalAdminToPublic(internalPath: string): string | null {
  const path = normalizeBookingPathname(internalPath);
  if (!path.startsWith(`${ADMIN_PREFIX}/`) && path !== ADMIN_PREFIX) {
    return null;
  }
  const suffix = path.slice(ADMIN_PREFIX.length);
  if (!suffix || suffix === "/") return "/dashboard";
  return suffix.startsWith("/") ? suffix : `/${suffix}`;
}

/**
 * On the booking host, platform `/admin/**` URLs must not hit `src/app/admin/**`.
 * Map them to booking public paths (`/dashboard`, `/login`, …).
 */
export function redirectBookingHostAwayFromPlatformAdmin(pathname: string): string {
  const path = normalizeBookingPathname(pathname);
  if (!path.startsWith("/admin")) return "/dashboard";
  if (path.startsWith("/admin/login")) return "/login";

  const rest = path.length > 6 ? path.slice(6) : "";
  const publicPath = normalizeBookingPathname(rest || "/dashboard");
  const internal = bookingPublicPathToInternal(publicPath);
  if (internal?.startsWith(ADMIN_PREFIX)) {
    return bookingInternalAdminToPublic(internal) ?? "/dashboard";
  }
  return "/dashboard";
}
