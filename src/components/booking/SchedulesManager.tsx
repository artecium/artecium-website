"use client";

import {
  createStaffBreak,
  deleteStaffBreak,
  saveWorkingHoursDay,
} from "@/lib/actions/booking/schedules";
import { BookingButton } from "@/components/booking/BookingButton";
import { bookingActionErrorMessage } from "@/lib/booking/submit-server-action";
import { useBookingButtonFeedbackRegistry } from "@/lib/booking/use-booking-button-feedback";
import type { BookingBreakRow } from "@/lib/data/booking/schedules";
import type { BookingStaff, BookingWorkingHours } from "@/types/booking";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

interface SchedulesManagerProps {
  staff: BookingStaff[];
  initialStaffId: string | null;
  workingHours: BookingWorkingHours[];
  breaks: BookingBreakRow[];
  canManage: boolean;
}

export function SchedulesManager({
  staff,
  initialStaffId,
  workingHours,
  breaks,
  canManage,
}: SchedulesManagerProps) {
  const t = useTranslations("booking.schedules");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [staffId, setStaffId] = useState(initialStaffId ?? "");
  const [error, setError] = useState<string | null>(null);
  const buttonFeedback = useBookingButtonFeedbackRegistry();

  const hoursByDay = useMemo(() => {
    const map = new Map<number, BookingWorkingHours>();
    for (const h of workingHours) map.set(h.day_of_week, h);
    return map;
  }, [workingHours]);

  if (staff.length === 0) {
    return <p className="text-sm text-[#94A3B8]">{t("noStaff")}</p>;
  }

  return (
    <div className="space-y-6">
      <label className="block text-sm text-[#94A3B8]">
        {t("selectStaff")}
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
      <div className="space-y-3">
        {DAY_KEYS.map((key, day) => {
          const row = hoursByDay.get(day);
          return (
            <div
              key={key}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-[#1E293B] px-4 py-3"
            >
              <span className="w-24 text-sm text-white">{t(`days.${key}`)}</span>
              <input
                type="time"
                defaultValue={row?.start_time?.slice(0, 5) ?? "09:00"}
                id={`start-${day}`}
                disabled={!canManage}
                className="rounded-lg border border-[#1E293B] bg-[#050816] px-2 py-1 text-white"
              />
              <input
                type="time"
                defaultValue={row?.end_time?.slice(0, 5) ?? "18:00"}
                id={`end-${day}`}
                disabled={!canManage}
                className="rounded-lg border border-[#1E293B] bg-[#050816] px-2 py-1 text-white"
              />
              {canManage ? (
                <BookingButton
                  type="button"
                  variant="secondary"
                  feedbackKind="save"
                  disabled={!staffId}
                  state={buttonFeedback.getState(`hours-${day}`)}
                  onClick={async () => {
                    const start = (
                      document.getElementById(`start-${day}`) as HTMLInputElement
                    ).value;
                    const end = (document.getElementById(`end-${day}`) as HTMLInputElement).value;
                    setError(null);
                    try {
                      const result = await buttonFeedback.run(`hours-${day}`, () =>
                        saveWorkingHoursDay(staffId, day, `${start}:00`, `${end}:00`, true),
                      );
                      if (!result.ok) setError(result.error ?? "Save failed.");
                      else router.refresh();
                    } catch (err) {
                      setError(bookingActionErrorMessage(err));
                    }
                  }}
                >
                  {tCommon("save")}
                </BookingButton>
              ) : null}
            </div>
          );
        })}
      </div>
      <section>
        <h3 className="text-sm font-medium text-white">{t("breaks")}</h3>
        <ul className="mt-2 space-y-2 text-sm text-[#94A3B8]">
          {breaks.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-2">
              <span>
                {t(`days.${DAY_KEYS[b.day_of_week]}`)} {b.start_time.slice(0, 5)}–
                {b.end_time.slice(0, 5)}
              </span>
              {canManage ? (
                <BookingButton
                  type="button"
                  variant="danger"
                  feedbackKind="delete"
                  state={buttonFeedback.getState(`break-delete-${b.id}`)}
                  onClick={async () => {
                    setError(null);
                    try {
                      const result = await buttonFeedback.run(`break-delete-${b.id}`, () =>
                        deleteStaffBreak(b.id),
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
            className="mt-4 flex flex-wrap items-end gap-2"
            action={async (fd) => {
              fd.set("staff_id", staffId);
              setError(null);
              try {
                const result = await buttonFeedback.run("break-create", () =>
                  createStaffBreak(fd),
                );
                if (!result.ok) setError(result.error ?? "Create failed.");
                else router.refresh();
              } catch (err) {
                setError(bookingActionErrorMessage(err));
              }
            }}
          >
            <select
              name="day_of_week"
              className="min-h-10 rounded-lg border border-[#1E293B] bg-[#050816] px-2 py-1 text-white"
            >
              {DAY_KEYS.map((key, i) => (
                <option key={key} value={i}>
                  {t(`days.${key}`)}
                </option>
              ))}
            </select>
            <input
              type="time"
              name="start_time"
              required
              className="min-h-10 rounded-lg border border-[#1E293B] bg-[#050816] px-2 py-1 text-white"
            />
            <input
              type="time"
              name="end_time"
              required
              className="min-h-10 rounded-lg border border-[#1E293B] bg-[#050816] px-2 py-1 text-white"
            />
            <BookingButton
              type="submit"
              variant="primary"
              feedbackKind="add"
              state={buttonFeedback.getState("break-create")}
            >
              {t("addBreak")}
            </BookingButton>
          </form>
        ) : null}
      </section>
    </div>
  );
}