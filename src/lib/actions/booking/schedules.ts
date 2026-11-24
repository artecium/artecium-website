"use server";

import { createClient } from "@/lib/supabase/server";
import type { BookingActionResult } from "./context";
import { revalidateBookingAdmin, requireManageBusiness } from "./context";

async function assertStaffInBusiness(staffId: string, businessId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_staff")
    .select("id")
    .eq("id", staffId)
    .eq("business_id", businessId)
    .maybeSingle();
  return Boolean(data);
}

export async function saveWorkingHoursDay(
  staffId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  enabled: boolean,
): Promise<BookingActionResult> {
  const { businessId } = await requireManageBusiness();
  if (!(await assertStaffInBusiness(staffId, businessId))) {
    return { ok: false, error: "Staff not found." };
  }
  if (dayOfWeek < 0 || dayOfWeek > 6) {
    return { ok: false, error: "Invalid day." };
  }

  const supabase = await createClient();
  if (!enabled) {
    await supabase
      .from("booking_working_hours")
      .delete()
      .eq("staff_id", staffId)
      .eq("day_of_week", dayOfWeek);
    revalidateBookingAdmin();
    return { ok: true };
  }

  if (!startTime || !endTime || startTime >= endTime) {
    return { ok: false, error: "Invalid working hours." };
  }

  const { data: existing } = await supabase
    .from("booking_working_hours")
    .select("id")
    .eq("staff_id", staffId)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("booking_working_hours")
      .update({ start_time: startTime, end_time: endTime })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("booking_working_hours").insert({
      staff_id: staffId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidateBookingAdmin();
  return { ok: true };
}

export async function createStaffBreak(formData: FormData): Promise<BookingActionResult> {
  const { businessId } = await requireManageBusiness();
  const staffId = String(formData.get("staff_id") ?? "");
  if (!(await assertStaffInBusiness(staffId, businessId))) {
    return { ok: false, error: "Staff not found." };
  }

  const day = Number(formData.get("day_of_week"));
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  if (day < 0 || day > 6 || !startTime || !endTime || startTime >= endTime) {
    return { ok: false, error: "Invalid break." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("booking_staff_breaks").insert({
    staff_id: staffId,
    day_of_week: day,
    start_time: startTime,
    end_time: endTime,
  });
  if (error) return { ok: false, error: error.message };
  revalidateBookingAdmin();
  return { ok: true };
}

export async function deleteStaffBreak(breakId: string): Promise<BookingActionResult> {
  const { businessId } = await requireManageBusiness();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("booking_staff_breaks")
    .select("staff_id")
    .eq("id", breakId)
    .maybeSingle();

  if (!row?.staff_id || !(await assertStaffInBusiness(row.staff_id, businessId))) {
    return { ok: false, error: "Break not found." };
  }

  const { error } = await supabase.from("booking_staff_breaks").delete().eq("id", breakId);
  if (error) return { ok: false, error: error.message };
  revalidateBookingAdmin();
  return { ok: true };
}

export async function createTimeOff(formData: FormData): Promise<BookingActionResult> {
  const { businessId } = await requireManageBusiness();
  const staffId = String(formData.get("staff_id") ?? "");
  if (!(await assertStaffInBusiness(staffId, businessId))) {
    return { ok: false, error: "Staff not found." };
  }

  const startsRaw = String(formData.get("starts_at") ?? "");
  const endsRaw = String(formData.get("ends_at") ?? "");
  const startsAt = startsRaw ? new Date(startsRaw).toISOString() : "";
  const endsAt = endsRaw ? new Date(endsRaw).toISOString() : "";
  if (!startsAt || !endsAt || startsAt >= endsAt) {
    return { ok: false, error: "Invalid time off range." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("booking_time_off").insert({
    staff_id: staffId,
    starts_at: startsAt,
    ends_at: endsAt,
    label: String(formData.get("label") ?? "").trim() || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidateBookingAdmin();
  return { ok: true };
}

export async function deleteTimeOff(timeOffId: string): Promise<BookingActionResult> {
  const { businessId } = await requireManageBusiness();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("booking_time_off")
    .select("staff_id")
    .eq("id", timeOffId)
    .maybeSingle();

  if (!row?.staff_id || !(await assertStaffInBusiness(row.staff_id, businessId))) {
    return { ok: false, error: "Time off not found." };
  }

  const { error } = await supabase.from("booking_time_off").delete().eq("id", timeOffId);
  if (error) return { ok: false, error: error.message };
  revalidateBookingAdmin();
  return { ok: true };
}
