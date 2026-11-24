import {
  bookingInternalAdminToPublic,
  bookingPublicPathToInternal,
  isBookingHostname,
  normalizeBookingPathname,
} from "./booking-host";
import { readRequestHostname } from "./client-links";

const ADMIN_PREFIX = "/booking/admin";

/** Must match `CLIENT_BOOKING_BASE` in `src/config/navigation/booking.ts`. */
const CLIENT_BOOKING_PREFIX = "/client/booking";

export function isClientPortalBookingPath(pathname: string | null | undefined): boolean {
  if (!pathname?.trim()) return false;
  const path = normalizeBookingPathname(pathname);
  return path === CLIENT_BOOKING_PREFIX || path.startsWith(`${CLIENT_BOOKING_PREFIX}/`);
}

export function bookingInternalAdminToClientPortal(internalPath: string): string | null {
  const path = normalizeBookingPathname(internalPath);
  if (!path.startsWith(`${ADMIN_PREFIX}/`) && path !== ADMIN_PREFIX) {
    return null;
  }
  const suffix = path.slice(ADMIN_PREFIX.length);
  if (!suffix || suffix === "/") {
    return `${CLIENT_BOOKING_PREFIX}/dashboard`;
  }
  return `${CLIENT_BOOKING_PREFIX}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
}

export type BookingAreaHrefContext = {
  hostname: string;
  /** Request pathname (`x-pathname` or browser pathname). */
  requestPathname?: string;
};

export function readBookingAreaHrefContext(
  headerGet: (name: string) => string | null,
): BookingAreaHrefContext {
  return {
    hostname: readRequestHostname(headerGet),
    requestPathname: headerGet("x-pathname") ?? undefined,
  };
}

/**
 * Same-origin href for booking admin pages:
 * - client portal entry → `/client/booking/...`
 * - booking host → public segments (`/dashboard`, …)
 * - otherwise → internal `/booking/admin/...`
 */
export function bookingAreaHref(
  internalPath: string,
  hostname: string,
  requestPathname?: string,
): string {
  const normalized = normalizeBookingPathname(internalPath);
  if (!normalized.startsWith(ADMIN_PREFIX)) {
    return normalized;
  }
  if (isClientPortalBookingPath(requestPathname)) {
    return bookingInternalAdminToClientPortal(normalized) ?? normalized;
  }
  if (isBookingHostname(hostname)) {
    return bookingInternalAdminToPublic(normalized) ?? normalized;
  }
  return normalized;
}

export function resolveBookingAreaHref(
  internalPath: string,
  ctx: BookingAreaHrefContext,
): string {
  return bookingAreaHref(internalPath, ctx.hostname, ctx.requestPathname);
}

export function bookingAdminPathnameForNavMatch(pathname: string): string {
  const path = normalizeBookingPathname(pathname);
  if (path.startsWith(ADMIN_PREFIX)) {
    return path;
  }
  if (isClientPortalBookingPath(path)) {
    const suffix = path.slice(CLIENT_BOOKING_PREFIX.length);
    if (!suffix || suffix === "/") {
      return `${ADMIN_PREFIX}/dashboard`;
    }
    return `${ADMIN_PREFIX}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
  }
  return bookingPublicPathToInternal(path) ?? path;
}
