/**
 * Static checks: MR integration script is gated and allowlist-bound.
 * Usage: npm run verify:booking-member-role-integration-guards
 */

import { readFileSync } from "node:fs";
import { BOOKING_ALLOWLISTED_PROJECT_REFS } from "./booking-integration-fixtures.mjs";

const script = readFileSync(
  new URL("./booking-member-role-integration.mjs", import.meta.url),
  "utf8",
);

const BOOKING_MEMBER_ROLE_INTEGRATION_ENV = "BOOKING_MEMBER_ROLE_INTEGRATION_TEST";

/** @type {{ name: string; pass: boolean; detail?: string }[]} */
const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
}

record(
  "defines integration env gate",
  script.includes(BOOKING_MEMBER_ROLE_INTEGRATION_ENV),
);
record(
  "uses assertBookingExplicitSandboxEnv",
  script.includes("assertBookingExplicitSandboxEnv"),
);
record(
  "uses BOOKING_ALLOW_REMOTE_TESTS via guards import",
  script.includes("booking-test-guards"),
);
record("allowlist non-empty", BOOKING_ALLOWLISTED_PROJECT_REFS.length > 0);
record("seven MR case ids in script", (script.match(/id: "MR-/g) ?? []).length === 7);
record("MR-07 marked no write in catalog", /MR-07[\s\S]*writes: false/.test(script));

for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
}
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
if (failed > 0) process.exit(1);
