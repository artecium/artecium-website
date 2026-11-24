"use client";

import { createTimeOff, deleteTimeOff } from "@/lib/actions/booking/schedules";
import { BookingButton } from "@/components/booking/BookingButton";
import { bookingActionErrorMessage } from "@/lib/booking/submit-server-action";
import { useBookingButtonFeedbackRegistry } from "@/lib/booking/use-booking-button-feedback";
import type { BookingTimeOffRow } from "@/lib/data/booking";
import type { BookingStaff } from "@/types/booking";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TimeOffManagerProps {
  staff: BookingStaff[];
  initialStaffId: string | null;
  timeOff: BookingTimeOffRow[];
  canManage: boolean;
}

export function TimeOffManager({
  staff,
  initialStaffId,
  timeOff,
  canManage,
}: TimeOffManagerProps) {
  const t = useTranslations("booking.timeOff");
  const tSchedules = useTranslations("booking.schedules");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [staffId, setStaffId] = useState(initialStaffId ?? "");
  const [error, setError] = useState<string | null>(null);
  const buttonFeedback = useBookingButtonFeedbackRegistry();

  if (staff.length === 0) {
    return <p className="text-sm text-[#94A3B8]">{t("noStaff")}</p>;
  }

  return (
    <div className="space-y-6">
      <label className="block text-sm text-[#94A3B8]">
        {tSchedules("selectStaff")}
        <select
          className="mt-1 block w-full max-w-md rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
          value={staffId}
          onChange={(e) => {
            setStaffId(e.target.value);
            router.push(`?staff=${e.target.value}`);
          }}
        >
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.display_name}
            </option>
          ))}
        </select>
      </label>
      {error ? (
        <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      <ul className="space-y-2">
        {timeOff.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#1E293B] px-4 py-3 text-sm"
          >
            <span className="text-white">
              {new Date(row.starts_at).toLocaleString()} →{" "}
              {new Date(row.ends_at).toLocaleString()}
              {row.label ? ` · ${row.label}` : ""}
            </span>
            {canManage ? (
              <BookingButton
                type="button"
                variant="danger"
                feedbackKind="delete"
                state={buttonFeedback.getState(`delete-${row.id}`)}
                onClick={async () => {
                  setError(null);
                  try {
                    const result = await buttonFeedback.run(`delete-${row.id}`, () =>
                      deleteTimeOff(row.id),
                    );
                    if (!result.ok) setError(result.error ?? "Delete failed.");
                    else router.refresh();
                  } catch (err) {
                    setError(bookingActionErrorMessage(err));
                  }
                }}
              >
                {tCommon("delete")}
              </BookingButton>
            ) : null}
          </li>
        ))}
      </ul>
      {canManage ? (
        <form
          className="grid gap-3 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/[0.04] p-4 sm:grid-cols-2"
          action={async (fd) => {
            fd.set("staff_id", staffId);
            setError(null);
            try {
              const result = await buttonFeedback.run("create-timeoff", () => createTimeOff(fd));
              if (!result.ok) setError(result.error ?? "Create failed.");
              else router.refresh();
            } catch (err) {
              setError(bookingActionErrorMessage(err));
            }
          }}
        >
          <input
            type="datetime-local"
            name="starts_at"
            required
            className="rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
          />
          <input
            type="datetime-local"
            name="ends_at"
            required
            className="rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
          />
          <input
            name="label"
            placeholder={t("labelOptional")}
            className="rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <BookingButton
              type="submit"
              variant="primary"
              feedbackKind="add"
              state={buttonFeedback.getState("create-timeoff")}
            >
              {t("add")}
            </BookingButton>
          </div>
        </form>
      ) : null}
    </div>
  );
}