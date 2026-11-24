/** Safe internal post-login paths (open redirect guard). */

import {
  BOOKING_ADMIN_PUBLIC_SEGMENTS,
  bookingPublicPathToInternal,
  isBookingHostname,
  isValidBusinessSlug,
  normalizeBookingPathname,
} from "@/lib/routing/booking-host";

const BOOKING_PREFIX = "/booking/";
const CLIENT_PREFIX = "/client/";
const CLIENT_BOOKING_PREFIX = "/client/booking";
const AREA_HUB_PATHS = new Set(["/acesso", "/en/acesso"]);

const BOOKING_HOST_PUBLIC_ADMIN = new Set<string>(BOOKING_ADMIN_PUBLIC_SEGMENTS);

export function sanitizeLoginNext(next: string | null | undefined): string | null {
  if (!next?.trim()) return null;
  const path = next.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (AREA_HUB_PATHS.has(path)) return path;
  if (path.startsWith(BOOKING_PREFIX) || path.startsWith(CLIENT_PREFIX)) {
    return path;
  }
  return null;
}

/**
 * `next` paths on booking.artecium.com (public URLs without `/booking/admin` prefix).
 */
export function sanitizeBookingHostLoginNext(next: string | null | undefined): string | null {
  if (!next?.trim()) return null;
  const path = normalizeBookingPathname(next.trim());
  if (!path.startsWith("/") || path.startsWith("//")) return null;

  const internal = sanitizeLoginNext(path);
  if (internal) return internal;

  if (path === "/") return "/dashboard";

  const first = path.slice(1).split("/")[0] ?? "";
  if (BOOKING_HOST_PUBLIC_ADMIN.has(first)) {
    return path;
  }
  if (path === "/login") return "/login";
  if (isValidBusinessSlug(first)) {
    return path;
  }
  if (path.startsWith("/api") || path.startsWith("/_next")) return null;

  const mapped = bookingPublicPathToInternal(path);
  if (mapped?.startsWith(BOOKING_PREFIX)) return path;

  return null;
}

/** Booking admin login always falls back to dashboard. */
export function sanitizeBookingLoginNext(next: string | null | undefined): string {
  const safe = sanitizeLoginNext(next);
  if (safe?.startsWith(BOOKING_PREFIX)) return safe;
  if (
    safe === CLIENT_BOOKING_PREFIX ||
    safe?.startsWith(`${CLIENT_BOOKING_PREFIX}/`)
  ) {
    return safe;
  }
  return "/booking/admin/dashboard";
}

export const DEFAULT_CLIENT_LOGIN_NEXT = "/client/dashboard";
export const DEFAULT_BOOKING_LOGIN_NEXT = "/booking/admin/dashboard";
/** Default after generic sign-in / sign-up when no explicit `next`. */
export const DEFAULT_POST_AUTH_PATH = "/acesso";

/** Post sign-up / email-confirm landing (open-redirect safe). */
export function resolveSafePostAuthPath(redirectTo?: string | null): string {
  return sanitizeLoginNext(redirectTo ?? undefined) ?? DEFAULT_POST_AUTH_PATH;
}

/** Supabase email confirmation redirect target (same origin). */
export function buildAuthCallbackUrl(
  origin: string,
  redirectTo?: string | null,
): string {
  const base = `${origin.replace(/\/$/, "")}/auth/callback`;
  let hostname = "";
  try {
    hostname = new URL(origin).hostname;
  } catch {
    hostname = "";
  }
  const safe = isBookingHostname(hostname)
    ? sanitizeBookingHostLoginNext(redirectTo) ??
      sanitizeLoginNext(redirectTo ?? undefined)
    : sanitizeLoginNext(redirectTo ?? undefined);
  if (safe) {
    return `${base}?next=${encodeURIComponent(safe)}`;
  }
  return base;
}

/** OAuth / email-confirm redirect target (open-redirect safe, host-aware). */
export function resolveSafePostAuthPathForHost(
  host: string,
  redirectTo?: string | null,
): string {
  if (isBookingHostname(host)) {
    return sanitizeBookingHostLoginNext(redirectTo) ?? "/dashboard";
  }
  return resolveSafePostAuthPath(redirectTo);
}
