"use server";

import {
  readFormCheckbox,
  readFormCheckboxWithDefault,
} from "@/lib/booking/form-data";
import { createClient } from "@/lib/supabase/server";
import type { BookingActionResult } from "./context";
import { revalidateBookingAdmin, requireBookingRowInBusiness, requireManageBusiness } from "./context";

export async function createBookingStaff(formData: FormData): Promise<BookingActionResult> {
  const { businessId } = await requireManageBusiness();
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!displayName) return { ok: false, error: "Display name is required." };

  const profileIdRaw = String(formData.get("profile_id") ?? "").trim();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking_staff")
    .insert({
      business_id: businessId,
      display_name: displayName,
      email: String(formData.get("email") ?? "").trim() || null,
      profile_id: profileIdRaw || null,
      accepts_online_bookings: readFormCheckboxWithDefault(
        formData,
        "accepts_online_bookings",
        true,
      ),
      is_active: readFormCheckboxWithDefault(formData, "is_active", true),
      calendar_color: String(formData.get("calendar_color") ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  if (!data?.id) return { ok: false, error: "Could not create staff member." };
  revalidateBookingAdmin();
  return { ok: true };
}

export async function updateBookingStaff(
  staffId: string,
  formData: FormData,
): Promise<BookingActionResult> {
  const { businessId } = await requireManageBusiness();
  const denied = await requireBookingRowInBusiness("booking_staff", staffId, businessId);
  if (denied) return denied;
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!displayName) return { ok: false, error: "Display name is required." };

  const profileIdRaw = String(formData.get("profile_id") ?? "").trim();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking_staff")
    .update({
      display_name: displayName,
      email: String(formData.get("email") ?? "").trim() || null,
      profile_id: profileIdRaw || null,
      accepts_online_bookings: readFormCheckbox(formData, "accepts_online_bookings"),
      is_active: readFormCheckbox(formData, "is_active"),
      calendar_color: String(formData.get("calendar_color") ?? "").trim() || null,
    })
    .eq("id", staffId)
    .eq("business_id", businessId)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data?.id) {
    return { ok: false, error: "Staff was not updated. Check access for this business." };
  }
  revalidateBookingAdmin();
  return { ok: true };
}

export async function setBookingStaffServices(
  staffId: string,
  serviceIds: string[],
): Promise<BookingActionResult> {
  const { businessId } = await requireManageBusiness();
  const supabase = await createClient();

  const { data: staffRow } = await supabase
    .from("booking_staff")
    .select("id")
    .eq("id", staffId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!staffRow) return { ok: false, error: "Staff not found." };

  const uniqueIds = [...new Set(serviceIds.filter(Boolean))];
  if (uniqueIds.length) {
    const { data: services } = await supabase
      .from("booking_services")
      .select("id")
      .eq("business_id", businessId)
      .in("id", uniqueIds);
    if ((services?.length ?? 0) !== uniqueIds.length) {
      return { ok: false, error: "Invalid service selection." };
    }
  }

  await supabase.from("booking_staff_services").delete().eq("staff_id", staffId);

  if (uniqueIds.length) {
    const { error } = await supabase.from("booking_staff_services").insert(
      uniqueIds.map((service_id) => ({ staff_id: staffId, service_id })),
    );
    if (error) return { ok: false, error: error.message };
  }

  revalidateBookingAdmin();
  return { ok: true };
}
