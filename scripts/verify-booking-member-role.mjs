/**
 * Phase 1: booking member role normalization (staff → professional).
 * Usage: npm run verify:booking-member-role
 */

import {
  BOOKING_MEMBER_ROLE_PROFESSIONAL,
  BOOKING_MEMBER_ROLE_STAFF_LEGACY,
  isBookingManageMemberRole,
  isBookingProfessionalMemberRole,
  memberRoleToRpcPayload,
  memberRoleToRpcPayloadPreMigration020,
  normalizeBookingMemberRole,
} from "./booking-member-role-lib.mjs";

/** @type {{ name: string; pass: boolean; detail?: string }[]} */
const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
}

record(
  "normalize staff → professional",
  normalizeBookingMemberRole("staff") === BOOKING_MEMBER_ROLE_PROFESSIONAL,
);
record(
  "normalize professional unchanged",
  normalizeBookingMemberRole("professional") === BOOKING_MEMBER_ROLE_PROFESSIONAL,
);
record(
  "isBookingProfessionalMemberRole(staff)",
  isBookingProfessionalMemberRole("staff"),
);
record(
  "isBookingManageMemberRole(professional) false",
  !isBookingManageMemberRole("professional"),
);
record(
  "memberRoleToRpcPayload(professional)",
  memberRoleToRpcPayload("professional") === "professional",
);
record(
  "memberRoleToRpcPayloadPreMigration020(professional)",
  memberRoleToRpcPayloadPreMigration020("professional") === BOOKING_MEMBER_ROLE_STAFF_LEGACY,
);
record(
  "memberRoleToRpcPayloadPreMigration020(manager)",
  memberRoleToRpcPayloadPreMigration020("manager") === "manager",
);

for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
}
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
if (failed > 0) process.exit(1);
