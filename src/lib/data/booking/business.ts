import { createClient } from "@/lib/supabase/server";
import type { BookingBusiness, BookingConfirmationMode } from "@/types/booking";

export async function getBookingBusiness(
  businessId: string,
): Promise<BookingBusiness | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking_businesses")
    .select(
      `
      id, slug, name, timezone, default_locale, currency, confirmation_mode,
      company_id, public_description, logo_url, brand_color,
      min_notice_minutes, max_booking_days, cancellation_notice_minutes,
      allow_customer_reschedule, slot_interval_minutes, is_active
    `,
    )
    .eq("id", businessId)
    .maybeSingle();

  if (error || !data) return null;
  return data as BookingBusiness;
}

export type BookingDashboardAppointmentScope = "business" | "own_staff";

export async function getBookingDashboardStats(
  businessId: string,
  options: {
    appointmentScope: BookingDashboardAppointmentScope;
    ownStaffIds?: string[];
  },
) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const ownStaffIds = options.ownStaffIds ?? [];
  const scopeOwn =
    options.appointmentScope === "own_staff" && ownStaffIds.length > 0;

  let pendingQuery = supabase
    .from("booking_appointments")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "pending");

  let todayQuery = supabase
    .from("booking_appointments")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .gte("starts_at", now.slice(0, 10))
    .lt("starts_at", `${now.slice(0, 10)}T23:59:59.999Z`);

  if (scopeOwn) {
    pendingQuery = pendingQuery.in("staff_id", ownStaffIds);
    todayQuery = todayQuery.in("staff_id", ownStaffIds);
  } else if (options.appointmentScope === "own_staff") {
    pendingQuery = pendingQuery.in("staff_id", ["00000000-0000-0000-0000-000000000000"]);
    todayQuery = todayQuery.in("staff_id", ["00000000-0000-0000-0000-000000000000"]);
  }

  const [services, staff, pending, today] = await Promise.all([
    supabase
      .from("booking_services")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("is_active", true),
    supabase
      .from("booking_staff")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("is_active", true),
    pendingQuery,
    todayQuery,
  ]);

  return {
    activeServices: services.count ?? 0,
    activeStaff: staff.count ?? 0,
    pendingAppointments: pending.count ?? 0,
    appointmentsToday: today.count ?? 0,
  };
}

export type UpdateBookingBusinessInput = {
  name?: string;
  timezone?: string;
  default_locale?: "pt-PT" | "en";
  confirmation_mode?: BookingConfirmationMode;
  public_description?: string | null;
  min_notice_minutes?: number;
  max_booking_days?: number;
  allow_customer_reschedule?: boolean;
  slot_interval_minutes?: number;
  company_id?: string | null;
};
