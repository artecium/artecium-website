/**
 * Client portal booking route parity (no network).
 * Usage: npm run verify:client-booking-routes
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeBookingPathname } from "../src/lib/routing/booking-host.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const ADMIN_PREFIX = "/booking/admin";
const CLIENT_BOOKING_PREFIX = "/client/booking";

/** Keep in sync with `clientPortalBookingNavKeys` in booking.ts */
const EXPECTED_NAV_KEYS = [
  "dashboard",
  "calendar",
  "appointments",
  "services",
  "staff",
  "schedules",
  "timeOff",
  "customers",
  "team",
  "settings",
];

function bookingInternalAdminToClientPortal(internalPath) {
  const normalized = normalizeBookingPathname(internalPath);
  if (!normalized.startsWith(`${ADMIN_PREFIX}/`) && normalized !== ADMIN_PREFIX) {
    return null;
  }
  const suffix = normalized.slice(ADMIN_PREFIX.length);
  if (!suffix || suffix === "/") {
    return `${CLIENT_BOOKING_PREFIX}/dashboard`;
  }
  return `${CLIENT_BOOKING_PREFIX}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
}

/** @type {{ name: string; pass: boolean; detail?: string }[]} */
const results = [];

function check(name, condition, detail) {
  results.push({ name, pass: Boolean(condition), detail });
}

const reExportRoutes = [
  { segment: "appointments", internal: "/booking/admin/appointments" },
  { segment: "schedules", internal: "/booking/admin/schedules" },
  { segment: "time-off", internal: "/booking/admin/time-off" },
  { segment: "team", internal: "/booking/admin/team" },
];

function readClientPortalBookingNavKeysFromSource() {
  const source = fs.readFileSync(
    path.join(root, "src", "config", "navigation", "booking.ts"),
    "utf8",
  );
  const match = source.match(
    /export const clientPortalBookingNavKeys = \[([\s\S]*?)\] as const;/,
  );
  if (!match) return null;
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function main() {
  for (const { segment, internal } of reExportRoutes) {
    const pagePath = path.join(
      root,
      "src",
      "app",
      "client",
      "booking",
      segment,
      "page.tsx",
    );
    check(
      `re-export page exists: /client/booking/${segment}`,
      fs.existsSync(pagePath),
      pagePath,
    );
    const expectedClient = `${CLIENT_BOOKING_PREFIX}/${segment}`;
    check(
      `href map: ${internal}`,
      bookingInternalAdminToClientPortal(internal) === expectedClient,
      bookingInternalAdminToClientPortal(internal),
    );
  }

  const navKeys = readClientPortalBookingNavKeysFromSource();
  check("clientPortalBookingNavKeys parsed from source", navKeys !== null, String(navKeys));
  if (navKeys) {
    check(
      "clientPortalBookingNavKeys matches expected set",
      navKeys.length === EXPECTED_NAV_KEYS.length &&
        EXPECTED_NAV_KEYS.every((key) => navKeys.includes(key)),
      navKeys.join(", "),
    );
  }

  const passed = results.filter((r) => r.pass).length;
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\n${passed}/${results.length} checks passed`);
  if (passed !== results.length) process.exit(1);
}

main();
