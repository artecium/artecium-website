/** Public booking page types (no internal/admin fields). */

export interface BookingPublicBusiness {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  default_locale: "pt-PT" | "en";
  currency: string;
  confirmation_mode: "automatic" | "manual";
  public_description: string | null;
  logo_url: string | null;
  brand_color: string | null;
  min_notice_minutes: number;
  max_booking_days: number;
  slot_interval_minutes: number;
}

export interface BookingPublicService {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number | null;
}

export interface BookingPublicStaffOption {
  id: string;
  display_name: string;
}

export interface BookingPublicSlot {
  starts_at: string;
  staff_id: string;
}

export interface BookingPublicAppointmentResult {
  public_reference: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  starts_at: string;
  ends_at: string;
  replayed: boolean;
  /** One-time token; only returned on first successful create (not idempotent replay). */
  manage_token?: string | null;
}

export interface BookingPublicGuestAppointmentView {
  business_slug: string;
  business_name: string;
  timezone: string;
  service_name: string;
  service_id: string;
  staff_id: string;
  starts_at: string;
  ends_at: string;
  status: BookingPublicAppointmentResult["status"];
  allow_customer_reschedule: boolean;
  cancellation_notice_minutes: number;
  guest_name: string;
}
