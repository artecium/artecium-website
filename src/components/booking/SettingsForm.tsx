"use client";

import { updateBookingBusinessSettings } from "@/lib/actions/booking/business";
import { BookingButton } from "@/components/booking/BookingButton";
import {
  runBookingAction,
  useBookingButtonFeedback,
} from "@/lib/booking/use-booking-button-feedback";
import type { BookingBusiness } from "@/types/booking";
import { BOOKING_CONFIRMATION_MODES } from "@/types/booking";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SettingsFormProps {
  business: BookingBusiness;
  canManage: boolean;
}

export function SettingsForm({ business, canManage }: SettingsFormProps) {
  const t = useTranslations("booking.settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const saveFeedback = useBookingButtonFeedback();

  return (
    <form
      className="max-w-xl space-y-4 rounded-2xl border border-[#1E293B] bg-[#0E1324]/60 p-6"
      action={async (fd) => {
        if (!canManage) return;
        setError(null);
        const result = await runBookingAction(saveFeedback, () =>
          updateBookingBusinessSettings({
            name: String(fd.get("name") ?? ""),
            timezone: String(fd.get("timezone") ?? ""),
            default_locale: fd.get("default_locale") === "en" ? "en" : "pt-PT",
            confirmation_mode: String(fd.get("confirmation_mode")) as
              | "automatic"
              | "manual",
            public_description: String(fd.get("public_description") ?? "").trim() || null,
            min_notice_minutes: Number(fd.get("min_notice_minutes")),
            max_booking_days: Number(fd.get("max_booking_days")),
            slot_interval_minutes: Number(fd.get("slot_interval_minutes")),
            allow_customer_reschedule: fd.get("allow_customer_reschedule") === "on",
            company_id: String(fd.get("company_id") ?? "").trim() || null,
          }),
        );
        if (!result.ok) setError(result.error ?? "Save failed.");
        else router.refresh();
      }}
    >
      {error ? (
        <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      <fieldset disabled={!canManage} className="space-y-4 disabled:opacity-70">
        <div>
          <label className="mb-1 block text-sm text-[#94A3B8]" htmlFor="name">
            {t("businessName")}
          </label>
          <input
            id="name"
            name="name"
            defaultValue={business.name}
            className="w-full rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[#94A3B8]" htmlFor="confirmation_mode">
            {t("confirmationMode")}
          </label>
          <select
            id="confirmation_mode"
            name="confirmation_mode"
            defaultValue={business.confirmation_mode}
            className="w-full rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
          >
            {BOOKING_CONFIRMATION_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {t(`confirmation.${mode}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-[#94A3B8]" htmlFor="public_description">
            {t("publicDescription")}
          </label>
          <textarea
            id="public_description"
            name="public_description"
            rows={3}
            defaultValue={business.public_description ?? ""}
            className="w-full rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-[#94A3B8]" htmlFor="min_notice_minutes">
              {t("minNotice")}
            </label>
            <input
              id="min_notice_minutes"
              name="min_notice_minutes"
              type="number"
              min={0}
              defaultValue={business.min_notice_minutes}
              className="w-full rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#94A3B8]" htmlFor="max_booking_days">
              {t("maxBookingDays")}
            </label>
            <input
              id="max_booking_days"
              name="max_booking_days"
              type="number"
              min={1}
              defaultValue={business.max_booking_days}
              className="w-full rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-[#94A3B8]" htmlFor="company_id">
            {t("agencyCompanyId")}
          </label>
          <input
            id="company_id"
            name="company_id"
            defaultValue={business.company_id ?? ""}
            placeholder={t("agencyCompanyOptional")}
            className="w-full rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
          />
        </div>
        <input type="hidden" name="timezone" value={business.timezone} />
        <input type="hidden" name="default_locale" value={business.default_locale} />
        <input type="hidden" name="slot_interval_minutes" value={business.slot_interval_minutes} />
        {canManage ? (
          <BookingButton
            type="submit"
            variant="primary"
            feedbackKind="save"
            state={saveFeedback.state}
          >
            {tCommon("save")}
          </BookingButton>
        ) : (
          <p className="text-sm text-[#94A3B8]">{t("readOnly")}</p>
        )}
      </fieldset>
    </form>
  );
}