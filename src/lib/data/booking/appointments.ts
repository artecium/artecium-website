import { createClient } from "@/lib/supabase/server";
import type { BookingAppointmentStatus } from "@/types/booking";

export interface BookingAppointmentRow {
  id: string;
  business_id: string;
  service_id: string;
  staff_id: string;
  guest_name: string | null;
  guest_email: string | null;
  starts_at: string;
  ends_at: string;
  status: BookingAppointmentStatus;
  public_reference: string;
  booking_services: { name: string } | { name: string }[] | null;
  booking_staff: { display_name: string } | { display_name: string }[] | null;
}

export async function listBookingAppointments(
  businessId: string,
  from?: string,
  to?: string,
): Promise<BookingAppointmentRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("booking_appointments")
    .select(
      `
      id, business_id, service_id, staff_id,
      guest_name, guest_email, starts_at, ends_at, status, public_reference,
      booking_services ( name ),
      booking_staff ( display_name )
    `,
    )
    .eq("business_id", businessId)
    .order("starts_at", { ascending: true });

  if (from) query = query.gte("starts_at", from);
  if (to) query = query.lte("starts_at", to);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as BookingAppointmentRow[];
}
