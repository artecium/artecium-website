"use server";

import {
  readFormCheckbox,
  readFormCheckboxWithDefault,
} from "@/lib/booking/form-data";
import { createClient } from "@/lib/supabase/server";
import type { BookingActionResult } from "./context";
import { revalidateBookingAdmin, requireBookingRowInBusiness, requireManageBusiness } from "./context";

function parseIntField(value: FormDataEntryValue | null, fallback: number): number {
  const n = Number(String(value ?? ""));
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

export async function createBookingService(formData: FormData): Promise<BookingActionResult> {
  const { businessId } = await requireManageBusiness();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Name is required." };

  const duration = parseIntField(formData.get("duration_minutes"), 30);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking_services")
    .insert({
      business_id: businessId,
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      duration_minutes: Math.max(5, duration),
      buffer_before_minutes: Math.max(0, parseIntField(formData.get("buffer_before_minutes"), 0)),
      buffer_after_minutes: Math.max(0, parseIntField(formData.get("buffer_after_minutes"), 0)),
      price_cents: formData.get("price_cents")
        ? Math.max(0, parseIntField(formData.get("price_cents"), 0))
        : null,
      is_active: readFormCheckboxWithDefault(formData, "is_active", true),
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  if (!data?.id) return { ok: false, error: "Could not create service." };
  revalidateBookingAdmin();
  return { ok: true };
}

export async function updateBookingService(
  serviceId: string,
  formData: FormData,
): Promise<BookingActionResult> {
  const { businessId } = await requireManageBusiness();
  const denied = await requireBookingRowInBusiness("booking_services", serviceId, businessId);
  if (denied) return denied;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Name is required." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking_services")
    .update({
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      duration_minutes: Math.max(5, parseIntField(formData.get("duration_minutes"), 30)),
      buffer_before_minutes: Math.max(
        0,
        parseIntField(formData.get("buffer_before_minutes"), 0),
      ),
      buffer_after_minutes: Math.max(
        0,
        parseIntField(formData.get("buffer_after_minutes"), 0),
      ),
      price_cents: formData.get("price_cents")
        ? Math.max(0, parseIntField(formData.get("price_cents"), 0))
        : null,
      is_active: readFormCheckbox(formData, "is_active"),
    })
    .eq("id", serviceId)
    .eq("business_id", businessId)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data?.id) {
    return { ok: false, error: "Service was not updated. Check access for this business." };
  }
  revalidateBookingAdmin();
  return { ok: true };
}

export async function deleteBookingService(serviceId: string): Promise<BookingActionResult> {
  const { businessId } = await requireManageBusiness();
  const denied = await requireBookingRowInBusiness("booking_services", serviceId, businessId);
  if (denied) return denied;
  const supabase = await createClient();
  const { error } = await supabase
    .from("booking_services")
    .delete()
    .eq("id", serviceId)
    .eq("business_id", businessId);

  if (error) return { ok: false, error: error.message };
  revalidateBookingAdmin();
  return { ok: true };
}
