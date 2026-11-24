"use server";

import { isValidBusinessSlug } from "@/lib/routing/booking-host";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { BOOKING_BUSINESS_COOKIE } from "@/lib/booking/constants";
import { requireBookingSession } from "@/lib/auth/booking-session";
import type { BookingActionResult } from "./context";
import { assertUserCanLinkCompany } from "./company-link";
import { revalidateBookingAdmin, requireManageBusiness } from "./context";
import type { UpdateBookingBusinessInput } from "@/lib/data/booking/business";
import { BOOKING_CONFIRMATION_MODES } from "@/types/booking";

export async function createBookingBusiness(formData: FormData): Promise<BookingActionResult> {
  await requireBookingSession();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "Europe/Lisbon").trim();

  if (!name) return { ok: false, error: "Name is required." };
  if (!isValidBusinessSlug(slug)) {
    return { ok: false, error: "Invalid URL slug." };
  }

  const supabase = await createClient();
  const { data: businessId, error } = await supabase.rpc(
    "booking_create_business_with_owner",
    {
      p_slug: slug,
      p_name: name,
      p_timezone: timezone || "Europe/Lisbon",
    },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  const id = businessId as string;
  const cookieStore = await cookies();
  cookieStore.set(BOOKING_BUSINESS_COOKIE, id, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  revalidateBookingAdmin();
  return { ok: true };
}

export async function updateBookingBusinessSettings(
  input: UpdateBookingBusinessInput,
): Promise<BookingActionResult> {
  const { businessId, userId } = await requireManageBusiness();
  const supabase = await createClient();

  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { ok: false, error: "Name is required." };
    payload.name = name;
  }
  if (input.timezone !== undefined) payload.timezone = input.timezone.trim();
  if (input.default_locale !== undefined) payload.default_locale = input.default_locale;
  if (input.confirmation_mode !== undefined) {
    if (!BOOKING_CONFIRMATION_MODES.includes(input.confirmation_mode)) {
      return { ok: false, error: "Invalid confirmation mode." };
    }
    payload.confirmation_mode = input.confirmation_mode;
  }
  if (input.public_description !== undefined) {
    payload.public_description = input.public_description;
  }
  if (input.min_notice_minutes !== undefined) {
    payload.min_notice_minutes = Math.max(0, Math.floor(input.min_notice_minutes));
  }
  if (input.max_booking_days !== undefined) {
    payload.max_booking_days = Math.max(1, Math.floor(input.max_booking_days));
  }
  if (input.allow_customer_reschedule !== undefined) {
    payload.allow_customer_reschedule = input.allow_customer_reschedule;
  }
  if (input.slot_interval_minutes !== undefined) {
    payload.slot_interval_minutes = Math.max(5, Math.floor(input.slot_interval_minutes));
  }
  if (input.company_id !== undefined) {
    if (input.company_id === null || input.company_id === "") {
      payload.company_id = null;
    } else {
      const linkCheck = await assertUserCanLinkCompany(userId, input.company_id);
      if (!linkCheck.ok) return linkCheck;
      payload.company_id = input.company_id;
    }
  }

  const { error } = await supabase
    .from("booking_businesses")
    .update(payload)
    .eq("id", businessId);

  if (error) return { ok: false, error: error.message };
  revalidateBookingAdmin();
  return { ok: true };
}
