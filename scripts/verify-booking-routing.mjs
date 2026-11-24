/**
 * Booking host/path mapping checks (no network).
 * Usage: npm run verify:booking-routing
 */

import {
  DEFAULT_BOOKING_HOSTNAME,
  bookingPublicPathToInternal,
  isBookingHostname,
  isBookingProtectedAdminPath,
  isValidBusinessSlug,
  BOOKING_RESERVED_SLUGS,
  redirectBookingHostAwayFromPlatformAdmin,
} from "../src/lib/routing/booking-host.ts";

/** @typedef {{ name: string; pass: boolean; detail: string }} CheckResult */
/** @type {CheckResult[]} */
const results = [];

function check(name, condition, detail) {
  results.push({ name, pass: Boolean(condition), detail });
}

function main() {
  check(
    "hostname: booking host",
    isBookingHostname("booking.artecium.com") &&
      isBookingHostname("Booking.artecium.com:3000"),
    DEFAULT_BOOKING_HOSTNAME,
  );
  check(
    "hostname: not portal",
    !isBookingHostname("client.artecium.com"),
    "client.artecium.com",
  );

  check(
    "admin: /dashboard",
    bookingPublicPathToInternal("/dashboard") === "/booking/admin/dashboard",
    bookingPublicPathToInternal("/dashboard"),
  );
  check(
    "admin: root",
    bookingPublicPathToInternal("/") === "/booking/admin/dashboard",
    bookingPublicPathToInternal("/"),
  );
  check(
    "public: business slug",
    bookingPublicPathToInternal("/demo-salon") === "/booking/b/demo-salon",
    bookingPublicPathToInternal("/demo-salon"),
  );
  check(
    "public: nested path",
    bookingPublicPathToInternal("/demo-salon/confirm") ===
      "/booking/b/demo-salon/confirm",
    bookingPublicPathToInternal("/demo-salon/confirm"),
  );
  check(
    "reserved slug rejected",
    !isValidBusinessSlug("dashboard") && BOOKING_RESERVED_SLUGS.has("dashboard"),
    "dashboard",
  );
  check(
    "login not rewritten",
    bookingPublicPathToInternal("/login") === null,
    "null",
  );
  check(
    "protected admin",
    isBookingProtectedAdminPath("/calendar") &&
      !isBookingProtectedAdminPath("/login"),
    "/calendar",
  );
  check(
    "invalid slug not mapped",
    bookingPublicPathToInternal("/UPPER") === null,
    "null",
  );

  check(
    "platform admin → booking dashboard",
    redirectBookingHostAwayFromPlatformAdmin("/admin/dashboard") === "/dashboard",
    redirectBookingHostAwayFromPlatformAdmin("/admin/dashboard"),
  );
  check(
    "platform admin login → booking login",
    redirectBookingHostAwayFromPlatformAdmin("/admin/login") === "/login",
    "/login",
  );
  check(
    "platform admin calendar → booking calendar",
    redirectBookingHostAwayFromPlatformAdmin("/admin/calendar") === "/calendar",
    "/calendar",
  );
  const passed = results.filter((r) => r.pass).length;
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\n${passed}/${results.length} checks passed`);
  if (passed !== results.length) process.exit(1);
}

main();
