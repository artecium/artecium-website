/** Artecium Booking domain types (separate from agency platform types). */

export const BOOKING_CONFIRMATION_MODES = ["automatic", "manual"] as const;
export type BookingConfirmationMode = (typeof BOOKING_CONFIRMATION_MODES)[number];

/** Includes legacy `staff` until migration 035; prefer `professional` in new code. */
export const BOOKING_MEMBER_ROLES = [
  "owner",
  "manager",
  "professional",
  "staff",
] as const;
export type BookingMemberRole = (typeof BOOKING_MEMBER_ROLES)[number];

export const BOOKING_APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
] as const;
export type BookingAppointmentStatus = (typeof BOOKING_APPOINTMENT_STATUSES)[number];

export const BOOKING_PAYMENT_STATUSES = [
  "unpaid",
  "pending",
  "paid",
  "refunded",
  "waived",
] as const;
export type BookingPaymentStatus = (typeof BOOKING_PAYMENT_STATUSES)[number];

export interface BookingBusiness {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  default_locale: "pt-PT" | "en";
  currency: string;
  confirmation_mode: BookingConfirmationMode;
  company_id: string | null;
  public_description: string | null;
  logo_url: string | null;
  brand_color: string | null;
  min_notice_minutes: number;
  max_booking_days: number;
  cancellation_notice_minutes: number;
  allow_customer_reschedule: boolean;
  slot_interval_minutes: number;
  is_active: boolean;
}

export interface BookingService {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  price_cents: number | null;
  is_active: boolean;
  sort_order: number;
}

export interface BookingStaff {
  id: string;
  business_id: string;
  profile_id: string | null;
  display_name: string;
  email: string | null;
  is_active: boolean;
  accepts_online_bookings: boolean;
  calendar_color: string | null;
  sort_order: number;
}

export interface BookingWorkingHours {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface BookingTimeOff {
  id: string;
  staff_id: string;
  starts_at: string;
  ends_at: string;
  label: string | null;
}

export interface BookingAppointment {
  id: string;
  business_id: string;
  service_id: string;
  staff_id: string;
  customer_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  starts_at: string;
  ends_at: string;
  status: BookingAppointmentStatus;
  source: "public" | "staff";
  public_reference: string;
  payment_status: BookingPaymentStatus;
}
