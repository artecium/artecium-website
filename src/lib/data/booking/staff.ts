import { createClient } from "@/lib/supabase/server";
import type { BookingStaff } from "@/types/booking";

export async function listBookingStaff(businessId: string): Promise<BookingStaff[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking_staff")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data ?? []) as BookingStaff[];
}

export async function listStaffServiceIds(staffId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_staff_services")
    .select("service_id")
    .eq("staff_id", staffId);
  return data?.map((r) => r.service_id as string) ?? [];
}
