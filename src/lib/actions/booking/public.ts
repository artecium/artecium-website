"use server";

import { isValidPublicIdempotencyKey } from "@/lib/booking/public-idempotency";
import { notifyBookingAppointmentStatusChange } from "@/lib/booking/notifications";
import {
  cancelPublicGuestAppointment,
  fetchPublicDaySlots,
  fetchPublicGuestAppointment,
  fetchPublicStaffForService,
  reschedulePublicGuestAppointment,
  submitPublicBooking,
  type SubmitPublicBookingInput,
} from "@/lib/data/booking/public";

export async function loadPublicStaffAction(slug: string, serviceId: string) {
  return fetchPublicStaffForService(slug, serviceId);
}

export async function loadPublicDaySlotsAction(
  slug: string,
  serviceId: string,
  staffId: string | null,
  localDate: string,
) {
  return fetchPublicDaySlots(slug, serviceId, staffId || null, localDate);
}

export async function createPublicAppointmentAction(
  input: Omit<SubmitPublicBookingInput, "idempotencyKey"> & { idempotencyKey: string },
) {
  if (!isValidPublicIdempotencyKey(input.idempotencyKey)) {
    return { ok: false as const, errorCode: "booking.public.errors.idempotency" };
  }

  const uuidLike =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidLike.test(input.serviceId) || !uuidLike.test(input.staffId)) {
    return { ok: false as const, errorCode: "booking.public.errors.validation" };
  }

  if (!input.startsAtIso || Number.isNaN(Date.parse(input.startsAtIso))) {
    return { ok: false as const, errorCode: "booking.public.errors.validation" };
  }

  const res = await submitPublicBooking(input);
  if (res.ok && res.data.status !== "cancelled" && input.guestEmail?.trim()) {
    void notifyBookingAppointmentStatusChange({
      guestEmail: input.guestEmail.trim(),
      businessName: input.businessSlug,
      status: res.data.status === "pending" ? "pending" : "confirmed",
      publicReference: res.data.public_reference,
    });
  }
  return res;
}

export async function loadGuestAppointmentAction(publicReference: string, manageToken: string) {
  return fetchPublicGuestAppointment(publicReference, manageToken);
}

export async function cancelGuestAppointmentAction(publicReference: string, manageToken: string) {
  return cancelPublicGuestAppointment(publicReference, manageToken);
}

export async function rescheduleGuestAppointmentAction(
  publicReference: string,
  manageToken: string,
  newStartsAtIso: string,
) {
  if (!newStartsAtIso || Number.isNaN(Date.parse(newStartsAtIso))) {
    return { ok: false as const, errorCode: "booking.public.errors.validation" };
  }
  return reschedulePublicGuestAppointment(publicReference, manageToken, newStartsAtIso);
}

export async function loadPublicDaySlotsForGuestAction(
  slug: string,
  serviceId: string,
  staffId: string,
  localDate: string,
) {
  return loadPublicDaySlotsAction(slug, serviceId, staffId, localDate);
}
