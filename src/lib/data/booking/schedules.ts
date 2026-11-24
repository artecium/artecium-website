import { createClient } from "@/lib/supabase/server";
import type { BookingWorkingHours } from "@/types/booking";

export interface BookingBreakRow {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface BookingTimeOffRow {
  id: string;
  staff_id: string;
  starts_at: string;
  ends_at: string;
  label: string | null;
}

export async function listWorkingHours(staffId: string): Promise<BookingWorkingHours[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_working_hours")
    .select("*")
    .eq("staff_id", staffId)
    .order("day_of_week");
  return (data ?? []) as BookingWorkingHours[];
}

export async function listStaffBreaks(staffId: string): Promise<BookingBreakRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_staff_breaks")
    .select("*")
    .eq("staff_id", staffId)
    .order("day_of_week");
  return (data ?? []) as BookingBreakRow[];
}

export async function listTimeOff(
  staffId: string,
  options?: { includeLabel: boolean },
): Promise<BookingTimeOffRow[]> {
  const supabase = await createClient();
  const table =
    options?.includeLabel === false
      ? "booking_time_off_availability"
      : "booking_time_off";
  const { data } = await supabase
    .from(table)
    .select("*")
    .eq("staff_id", staffId)
    .order("starts_at", { ascending: false });
  return (data ?? []).map((row) => ({
    ...(row as BookingTimeOffRow),
    label: options?.includeLabel === false ? null : (row as BookingTimeOffRow).label ?? null,
  })) as BookingTimeOffRow[];
}
