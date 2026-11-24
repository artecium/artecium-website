import { isSupabaseConfigured, publicBookingErrorKey } from "@/lib/booking/public-errors";
import { createClient } from "@/lib/supabase/server";
import type {
  BookingPublicAppointmentResult,
  BookingPublicBusiness,
  BookingPublicService,
  BookingPublicSlot,
  BookingPublicStaffOption,
} from "@/types/booking-public";

export type PublicDataResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: "not_configured" | "not_found" | "fetch_failed" };

async function supabaseOrNull() {
  if (!isSupabaseConfigured()) return null;
  return createClient();
}

export async function fetchPublicBusiness(
  slug: string,
): Promise<PublicDataResult<BookingPublicBusiness>> {
  const supabase = await supabaseOrNull();
  if (!supabase) return { ok: false, error: "not_configured" };

  const { data, error } = await supabase.rpc("booking_public_get_business", {
    p_slug: slug,
  });

  if (error) return { ok: false, error: "fetch_failed" };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, error: "not_found" };
  return { ok: true, data: row as BookingPublicBusiness };
}

export async function fetchPublicServices(
  slug: string,
): Promise<PublicDataResult<BookingPublicService[]>> {
  const supabase = await supabaseOrNull();
  if (!supabase) return { ok: false, error: "not_configured" };

  const { data, error } = await supabase.rpc("booking_public_list_services", {
    p_slug: slug,
  });

  if (error) return { ok: false, error: "fetch_failed" };
  return { ok: true, data: (data ?? []) as BookingPublicService[] };
}

export async function fetchPublicStaffForService(
  slug: string,
  serviceId: string,
): Promise<PublicDataResult<BookingPublicStaffOption[]>> {
  const supabase = await supabaseOrNull();
  if (!supabase) return { ok: false, error: "not_configured" };

  const { data, error } = await supabase.rpc("booking_public_list_staff_for_service", {
    p_slug: slug,
    p_service_id: serviceId,
  });

  if (error) return { ok: false, error: "fetch_failed" };
  return { ok: true, data: (data ?? []) as BookingPublicStaffOption[] };
}

export async function fetchPublicDaySlots(
  slug: string,
  serviceId: string,
  staffId: string | null,
  localDate: string,
): Promise<PublicDataResult<BookingPublicSlot[]>> {
  const supabase = await supabaseOrNull();
  if (!supabase) return { ok: false, error: "not_configured" };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
    return { ok: false, error: "fetch_failed" };
  }

  const { data, error } = await supabase.rpc("booking_public_list_day_slots", {
    p_business_slug: slug,
    p_service_id: serviceId,
    p_staff_id: staffId,
    p_local_date: localDate,
  });

  if (error) return { ok: false, error: "fetch_failed" };
  return { ok: true, data: (data ?? []) as BookingPublicSlot[] };
}

export interface SubmitPublicBookingInput {
  businessSlug: string;
  serviceId: string;
  staffId: string;
  startsAtIso: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  idempotencyKey: string;
}

export async function submitPublicBooking(
  input: SubmitPublicBookingInput,
): Promise<
  | { ok: true; data: BookingPublicAppointmentResult }
  | { ok: false; errorCode: string; raw?: { code?: string; message?: string } }
> {
  const supabase = await supabaseOrNull();
  if (!supabase) {
    return { ok: false, errorCode: "booking.public.errors.notConfigured" };
  }

  const guestName = input.guestName.trim();
  if (!guestName) {
    return { ok: false, errorCode: "booking.public.errors.guestName" };
  }

  const { data, error } = await supabase.rpc("booking_public_create_appointment", {
    p_business_slug: input.businessSlug,
    p_service_id: input.serviceId,
    p_staff_id: input.staffId,
    p_starts_at: input.startsAtIso,
    p_guest_name: guestName,
    p_guest_email: input.guestEmail.trim() || null,
    p_guest_phone: input.guestPhone.trim() || null,
    p_idempotency_key: input.idempotencyKey,
  });

  if (error) {
    console.error("[booking.public.create_appointment]", {
      code: error.code,
      message: error.message,
      businessSlug: input.businessSlug,
      serviceId: input.serviceId,
      staffId: input.staffId,
      startsAtIso: input.startsAtIso,
    });
    return {
      ok: false,
      errorCode: publicBookingErrorKey(error),
      raw: { code: error.code, message: error.message },
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return { ok: false, errorCode: "booking.public.errors.generic" };
  }

  return {
    ok: true,
    data: {
      public_reference: row.public_reference as string,
      status: row.status as BookingPublicAppointmentResult["status"],
      starts_at: row.starts_at as string,
      ends_at: row.ends_at as string,
      replayed: Boolean(row.replayed),
      manage_token: (row.manage_token as string | null) ?? null,
    },
  };
}

export async function fetchPublicGuestAppointment(
  publicReference: string,
  manageToken: string,
): Promise<
  | { ok: true; data: import("@/types/booking-public").BookingPublicGuestAppointmentView }
  | { ok: false; error: "not_configured" | "not_found" | "fetch_failed" }
> {
  const supabase = await supabaseOrNull();
  if (!supabase) return { ok: false, error: "not_configured" };

  const { data, error } = await supabase.rpc("booking_public_get_guest_appointment", {
    p_public_reference: publicReference.trim(),
    p_manage_token: manageToken.trim(),
  });

  if (error) {
    if (error.code === "P0002") return { ok: false, error: "not_found" };
    return { ok: false, error: "fetch_failed" };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, error: "not_found" };
  return { ok: true, data: row as import("@/types/booking-public").BookingPublicGuestAppointmentView };
}

export async function cancelPublicGuestAppointment(
  publicReference: string,
  manageToken: string,
): Promise<{ ok: true } | { ok: false; errorCode: string }> {
  const supabase = await supabaseOrNull();
  if (!supabase) return { ok: false, errorCode: "booking.public.errors.notConfigured" };

  const { error } = await supabase.rpc("booking_public_cancel_guest_appointment", {
    p_public_reference: publicReference.trim(),
    p_manage_token: manageToken.trim(),
  });

  if (error) return { ok: false, errorCode: publicBookingErrorKey(error) };
  return { ok: true };
}

export async function reschedulePublicGuestAppointment(
  publicReference: string,
  manageToken: string,
  newStartsAtIso: string,
): Promise<
  | { ok: true; data: { starts_at: string; ends_at: string } }
  | { ok: false; errorCode: string }
> {
  const supabase = await supabaseOrNull();
  if (!supabase) return { ok: false, errorCode: "booking.public.errors.notConfigured" };

  const { data, error } = await supabase.rpc("booking_public_reschedule_guest_appointment", {
    p_public_reference: publicReference.trim(),
    p_manage_token: manageToken.trim(),
    p_new_starts_at: newStartsAtIso,
  });

  if (error) return { ok: false, errorCode: publicBookingErrorKey(error) };

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, errorCode: "booking.public.errors.generic" };
  return {
    ok: true,
    data: { starts_at: row.starts_at as string, ends_at: row.ends_at as string },
  };
}
