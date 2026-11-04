import {
  BOOKING_MEMBER_ROLES,
  type BookingMemberRole,
} from "@/types/booking";

/** Canonical professional role (replaces member role `staff`). */
export const BOOKING_MEMBER_ROLE_PROFESSIONAL = "professional" as const;

/** @deprecated Member role; normalized to professional. Removed after migration 035. */
export const BOOKING_MEMBER_ROLE_STAFF_LEGACY = "staff" as const;

/** Roles allowed when inviting a team member (UI + server validation). */
export const BOOKING_INVITE_MEMBER_ROLES = [
  "manager",
  BOOKING_MEMBER_ROLE_PROFESSIONAL,
  BOOKING_MEMBER_ROLE_STAFF_LEGACY,
] as const;

export type BookingInviteMemberRole = (typeof BOOKING_INVITE_MEMBER_ROLES)[number];

export function isBookingMemberRole(value: string): value is BookingMemberRole {
  return (BOOKING_MEMBER_ROLES as readonly string[]).includes(value);
}

/** Map DB/API legacy `staff` to canonical `professional` for app logic. */
export function normalizeBookingMemberRole(role: string): BookingMemberRole {
  if (role === BOOKING_MEMBER_ROLE_STAFF_LEGACY) {
    return BOOKING_MEMBER_ROLE_PROFESSIONAL;
  }
  if (isBookingMemberRole(role)) {
    return role;
  }
  return role as BookingMemberRole;
}

export function isBookingProfessionalMemberRole(
  role: string | BookingMemberRole,
): boolean {
  return (
    role === BOOKING_MEMBER_ROLE_PROFESSIONAL ||
    role === BOOKING_MEMBER_ROLE_STAFF_LEGACY
  );
}

export function isBookingManageMemberRole(role: string | BookingMemberRole): boolean {
  return role === "owner" || role === "manager";
}

export function isBookingInviteMemberRole(role: string): role is BookingInviteMemberRole {
  return (BOOKING_INVITE_MEMBER_ROLES as readonly string[]).includes(role);
}

/**
 * Payload for `booking_create_member_invite` before migration 020 is applied on a DB,
 * only `manager` and `staff` are accepted. After 020, `professional` is preferred;
 * `staff` is still accepted and normalized server-side.
 */
export function memberRoleToRpcPayload(
  role: BookingMemberRole | BookingInviteMemberRole,
): "manager" | "staff" | "professional" {
  const normalized = normalizeBookingMemberRole(role);
  if (normalized === "manager") return "manager";
  if (normalized === BOOKING_MEMBER_ROLE_PROFESSIONAL) {
    return "professional";
  }
  return BOOKING_MEMBER_ROLE_STAFF_LEGACY;
}

/**
 * Use when calling RPC against a database that has not yet applied migration 020.
 * After AUTH-03 (020 applied), prefer {@link memberRoleToRpcPayload} only.
 */
export function memberRoleToRpcPayloadPreMigration020(
  role: BookingMemberRole | BookingInviteMemberRole,
): "manager" | "staff" {
  const payload = memberRoleToRpcPayload(role);
  if (payload === "manager") return "manager";
  return BOOKING_MEMBER_ROLE_STAFF_LEGACY;
}
