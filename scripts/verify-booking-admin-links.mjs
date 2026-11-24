/**
 * Booking admin href mapping (no network).
 * Usage: npm run verify:booking-admin-links
 */

import {
  bookingInternalAdminToPublic,
  bookingPublicPathToInternal,
  isBookingHostname,
  normalizeBookingPathname,
} from "../src/lib/routing/booking-host.ts";

const ADMIN_PREFIX = "/booking/admin";
const CLIENT_BOOKING_PREFIX = "/client/booking";

function isClientPortalBookingPath(pathname) {
  if (!pathname?.trim()) return false;
  const path = normalizeBookingPathname(pathname);
  return path === CLIENT_BOOKING_PREFIX || path.startsWith(`${CLIENT_BOOKING_PREFIX}/`);
}

function bookingInternalAdminToClientPortal(internalPath) {
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

function bookingAreaHref(internalPath, hostname, requestPathname) {
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

function bookingAdminPathnameForNavMatch(pathname) {
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

/** @type {{ name: string; pass: boolean; detail?: string }[]} */
const results = [];

function check(name, condition, detail) {
  results.push({ name, pass: Boolean(condition), detail });
}

function main() {
  check(
    "booking host dashboard href",
    bookingAreaHref("/booking/admin/dashboard", "booking.artecium.com") === "/dashboard",
    bookingAreaHref("/booking/admin/dashboard", "booking.artecium.com"),
  );
  check(
    "main site keeps internal path",
    bookingAreaHref("/booking/admin/services", "artecium.com") ===
      "/booking/admin/services",
    "/booking/admin/services",
  );
  check(
    "client portal services href",
    bookingAreaHref("/booking/admin/services", "artecium.com", "/client/booking/dashboard") ===
      "/client/booking/services",
    bookingAreaHref("/booking/admin/services", "artecium.com", "/client/booking/dashboard"),
  );
  check(
    "client portal calendar href",
    bookingAreaHref("/booking/admin/calendar", "localhost:3000", "/client/booking/calendar") ===
      "/client/booking/calendar",
    bookingAreaHref("/booking/admin/calendar", "localhost:3000", "/client/booking/calendar"),
  );
  check(
    "nav match from public calendar",
    bookingAdminPathnameForNavMatch("/calendar") === "/booking/admin/calendar",
    bookingAdminPathnameForNavMatch("/calendar"),
  );
  check(
    "nav match from client portal calendar",
    bookingAdminPathnameForNavMatch("/client/booking/calendar") ===
      "/booking/admin/calendar",
    bookingAdminPathnameForNavMatch("/client/booking/calendar"),
  );
  check(
    "onboarding rewrite",
    bookingPublicPathToInternal("/onboarding") === "/booking/admin/onboarding",
    bookingPublicPathToInternal("/onboarding"),
  );
  check(
    "team rewrite",
    bookingPublicPathToInternal("/team") === "/booking/admin/team",
    bookingPublicPathToInternal("/team"),
  );

  const passed = results.filter((r) => r.pass).length;
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\n${passed}/${results.length} checks passed`);
  if (passed !== results.length) process.exit(1);
}

main();
