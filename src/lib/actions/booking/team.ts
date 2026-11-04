"use server";

import { createClient } from "@/lib/supabase/server";
import { createHash, randomBytes } from "crypto";
import type { BookingActionResult } from "./context";
import { requireBookingSession } from "@/lib/auth/booking-session";
import {
  BOOKING_MEMBER_ROLE_PROFESSIONAL,
  isBookingInviteMemberRole,
  memberRoleToRpcPayloadPreMigration020,
  normalizeBookingMemberRole,
} from "@/lib/booking/member-role";
import { revalidateBookingAdmin, requireManageBusiness } from "./context";

export async function createBookingMemberInvite(formData: FormData): Promise<
  BookingActionResult & { inviteLink?: string }
> {
  const { businessId } = await requireManageBusiness();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const rawRole = String(formData.get("role") ?? BOOKING_MEMBER_ROLE_PROFESSIONAL);
  if (!email.includes("@")) return { ok: false, error: "Valid email is required." };
  if (!isBookingInviteMemberRole(rawRole)) {
    return { ok: false, error: "Invalid role." };
  }
  const normalized = normalizeBookingMemberRole(rawRole);
  if (normalized !== "manager" && normalized !== BOOKING_MEMBER_ROLE_PROFESSIONAL) {
    return { ok: false, error: "Invalid role." };
  }
  const rpcRole = memberRoleToRpcPayloadPreMigration020(
    normalized === "manager" ? "manager" : BOOKING_MEMBER_ROLE_PROFESSIONAL,
  );

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const supabase = await createClient();
  const { error } = await supabase.rpc("booking_create_member_invite", {
    p_business_id: businessId,
    p_email: email,
    p_role: rpcRole,
    p_token_hash: tokenHash,
    p_expires_at: expiresAt,
  });

  if (error) return { ok: false, error: error.message };

  revalidateBookingAdmin();
  return {
    ok: true,
    inviteLink: `/team/accept?token=${token}`,
  };
}

export async function acceptBookingMemberInvite(
  rawToken: string,
): Promise<BookingActionResult & { businessId?: string }> {
  await requireBookingSession();
  const token = rawToken.trim();
  if (!token) return { ok: false, error: "Invite token is required." };

  const supabase = await createClient();
  const { data: businessId, error } = await supabase.rpc("booking_accept_member_invite", {
    p_token: token,
  });

  if (error) return { ok: false, error: error.message };
  revalidateBookingAdmin();
  return { ok: true, businessId: businessId as string };
}
