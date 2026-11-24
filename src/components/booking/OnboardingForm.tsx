"use client";

import { createBookingBusiness } from "@/lib/actions/booking/business";
import { BookingButton } from "@/components/booking/BookingButton";
import {
  BOOKING_BUTTON_SUCCESS_MS,
  runBookingAction,
  useBookingButtonFeedback,
} from "@/lib/booking/use-booking-button-feedback";
import { bookingAreaHref } from "@/lib/routing";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export function OnboardingForm() {
  const t = useTranslations("booking.onboarding");
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState<string | null>(null);
  const createFeedback = useBookingButtonFeedback();

  return (
    <form
      className="space-y-4 rounded-2xl border border-[#1E293B] bg-[#0E1324]/60 p-6"
      action={async (formData) => {
        setError(null);
        const result = await runBookingAction(createFeedback, () =>
          createBookingBusiness(formData),
        );
        if (!result.ok) {
          setError(result.error ?? "Create failed.");
          return;
        }
        window.setTimeout(() => {
          router.push(
            bookingAreaHref(
              "/booking/admin/dashboard",
              window.location.host,
              pathname,
            ),
          );
          router.refresh();
        }, BOOKING_BUTTON_SUCCESS_MS);
      }}
    >
      {error ? (
        <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      <div>
        <label className="mb-1 block text-sm text-[#94A3B8]" htmlFor="name">
          {t("businessName")}
        </label>
        <input
          id="name"
          name="name"
          required
          className="w-full rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-[#94A3B8]" htmlFor="slug">
          {t("slug")}
        </label>
        <input
          id="slug"
          name="slug"
          required
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          className="w-full rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
        />
        <p className="mt-1 text-xs text-[#64748B]">{t("slugHint")}</p>
      </div>
      <div>
        <label className="mb-1 block text-sm text-[#94A3B8]" htmlFor="timezone">
          {t("timezone")}
        </label>
        <input
          id="timezone"
          name="timezone"
          defaultValue="Europe/Lisbon"
          className="w-full rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
        />
      </div>
      <BookingButton
        type="submit"
        variant="primary"
        feedbackKind="create"
        state={createFeedback.state}
        fullWidth
      >
        {t("submit")}
      </BookingButton>
    </form>
  );
}