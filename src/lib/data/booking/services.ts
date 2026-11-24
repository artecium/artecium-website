import { createClient } from "@/lib/supabase/server";
import type { BookingService } from "@/types/booking";

export async function listBookingServices(
  businessId: string,
): Promise<BookingService[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking_services")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data ?? []) as BookingService[];
}
