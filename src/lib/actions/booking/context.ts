"use server";

import { BOOKING_BUSINESS_COOKIE } from "@/lib/booking/constants";
import { requireBookingSession } from "@/lib/auth/booking-session";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export type BookingActionResult =
  | { ok: true }
  | { ok: false; error: string };

function assertActiveBusinessMembership(
  session: Awaited<ReturnType<typeof requireBookingSession>>,
): string {
  const businessId = session.activeBusinessId;
  if (!businessId || !session.memberships.some((m) => m.business_id === businessId)) {
    throw new Error("Active business is not authorized for this account.");
  }
  return businessId;
}

export async function requireManageBusiness(): Promise<{
  userId: string;
  businessId: string;
}> {
  const session = await requireBookingSession({
    requireBusiness: true,
    requireManage: true,
  });
  return {
    userId: session.userId,
    businessId: assertActiveBusinessMembership(session),
  };
}

/** Ensures a row id belongs to the active business (defense in depth with RLS). */
export async function assertBookingRowInBusiness(
  table:
    | "booking_services"
    | "booking_staff"
    | "booking_appointments"
    | "booking_customers",
  rowId: string,
  businessId: string,
): Promise<boolean> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase.from(table).select("id").eq("id", rowId).eq("business_id", businessId).maybeSingle();
  return Boolean(data?.id);
}

export async function requireBookingRowInBusiness(
  table: Parameters<typeof assertBookingRowInBusiness>[0],
  rowId: string,
  businessId: string,
): Promise<BookingActionResult | null> {
  if (!rowId) return { ok: false, error: "Missing record id." };
  const ok = await assertBookingRowInBusiness(table, rowId, businessId);
  if (!ok) return { ok: false, error: "Record not found or access denied." };
  return null;
}

export async function requireMemberBusiness(): Promise<{
  userId: string;
  businessId: string;
  canManage: boolean;
}> {
  const session = await requireBookingSession({ requireBusiness: true });
  return {
    userId: session.userId,
    businessId: assertActiveBusinessMembership(session),
    canManage: session.canManageActiveBusiness,
  };
}

export async function setActiveBookingBusiness(
  businessId: string,
): Promise<BookingActionResult> {
  const session = await requireBookingSession();
  if (session.membershipsLoadFailed) {
    return { ok: false, error: "Could not verify business access." };
  }
  if (!session.memberships.some((m) => m.business_id === businessId)) {
    return { ok: false, error: "Business not accessible." };
  }
  const cookieStore = await cookies();
  cookieStore.set(BOOKING_BUSINESS_COOKIE, businessId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  return { ok: true };
}

export async function revalidateBookingAdmin() {
  revalidatePath("/booking/admin", "layout");
  revalidatePath("/client/booking", "layout");
}
