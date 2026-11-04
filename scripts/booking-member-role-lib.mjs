/**
 * Pure member-role helpers for Node verify scripts (keep in sync with member-role.ts).
 */

export const BOOKING_MEMBER_ROLE_PROFESSIONAL = "professional";
export const BOOKING_MEMBER_ROLE_STAFF_LEGACY = "staff";

export const BOOKING_MEMBER_ROLES = [
  "owner",
  "manager",
  "professional",
  "staff",
];

export function isBookingMemberRole(value) {
  return BOOKING_MEMBER_ROLES.includes(value);
}

export function normalizeBookingMemberRole(role) {
  if (role === BOOKING_MEMBER_ROLE_STAFF_LEGACY) {
    return BOOKING_MEMBER_ROLE_PROFESSIONAL;
  }
  if (isBookingMemberRole(role)) {
    return role;
  }
  return role;
}

export function isBookingProfessionalMemberRole(role) {
  return (
    role === BOOKING_MEMBER_ROLE_PROFESSIONAL ||
    role === BOOKING_MEMBER_ROLE_STAFF_LEGACY
  );
}

export function isBookingManageMemberRole(role) {
  return role === "owner" || role === "manager";
}

export function memberRoleToRpcPayload(role) {
  const normalized = normalizeBookingMemberRole(role);
  if (normalized === "manager") return "manager";
  if (normalized === BOOKING_MEMBER_ROLE_PROFESSIONAL) {
    return "professional";
  }
  return BOOKING_MEMBER_ROLE_STAFF_LEGACY;
}

export function memberRoleToRpcPayloadPreMigration020(role) {
  const payload = memberRoleToRpcPayload(role);
  if (payload === "manager") return "manager";
  return BOOKING_MEMBER_ROLE_STAFF_LEGACY;
}
