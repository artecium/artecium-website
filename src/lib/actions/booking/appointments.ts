"use server";

import { createClient } from "@/lib/supabase/server";
import { BOOKING_APPOINTMENT_STATUSES, type BookingAppointmentStatus } from "@/types/booking";
import type { BookingActionResult } from "./context";
import { revalidateBookingAdmin, requireBookingRowInBusiness, requireManageBusiness } from "./context";

export async function updateBookingAppointmentStatus(
  appointmentId: string,
  status: BookingAppointmentStatus,
): Promise<BookingActionResult> {
  const { businessId } = await requireManageBusiness();
  const denied = await requireBookingRowInBusiness("booking_appointments", appointmentId, businessId);
  if (denied) return denied;
  if (!BOOKING_APPOINTMENT_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid status." };
  }

  const supabase = await createClient();
  const { data: existing, error: loadError } = await supabase
    .from("booking_appointments")
    .select(
      "guest_email, public_reference, booking_businesses ( name )",
    )
    .eq("id", appointmentId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (loadError || !existing) {
    return { ok: false, error: loadError?.message ?? "Appointment not found." };
  }

  const { error } = await supabase
    .from("booking_appointments")
    .update({ status })
    .eq("id", appointmentId)
    .eq("business_id", businessId);

  if (error) return { ok: false, error: error.message };

  const business = existing.booking_businesses as { name?: string } | { name?: string }[] | null;
  const businessName = Array.isArray(business) ? business[0]?.name : business?.name;

  const { notifyBookingAppointmentStatusChange } = await import("@/lib/booking/notifications");
  void notifyBookingAppointmentStatusChange({
    guestEmail: (existing.guest_email as string | null) ?? null,
    businessName: businessName ?? "Booking",
    status,
    publicReference: (existing.public_reference as string | null) ?? null,
  });

  revalidateBookingAdmin();
  return { ok: true };
}
