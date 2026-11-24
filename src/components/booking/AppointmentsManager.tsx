"use client";

import { updateBookingAppointmentStatus } from "@/lib/actions/booking/appointments";
import { BookingButton } from "@/components/booking/BookingButton";
import { bookingActionErrorMessage } from "@/lib/booking/submit-server-action";
import { useBookingButtonFeedbackRegistry } from "@/lib/booking/use-booking-button-feedback";
import { EmptyState } from "@/components/platform/EmptyState";
import type { BookingAppointmentRow } from "@/lib/data/booking/appointments";
import { BOOKING_APPOINTMENT_STATUSES } from "@/types/booking";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AppointmentsManagerProps {
  appointments: BookingAppointmentRow[];
  canManage: boolean;
}

export function AppointmentsManager({
  appointments,
  canManage,
}: AppointmentsManagerProps) {
  const t = useTranslations("booking.appointments");
  const [error, setError] = useState<string | null>(null);
  const buttonFeedback = useBookingButtonFeedbackRegistry();
  const router = useRouter();

  if (appointments.length === 0) {
    return <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />;
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      <ul className="space-y-3">
        {appointments.map((apt) => (
          <li
            key={apt.id}
            className="rounded-xl border border-[#1E293B] bg-[#0E1324]/40 px-4 py-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white">
                  {new Date(apt.starts_at).toLocaleString()} · {apt.guest_name ?? "—"}
                </p>
                <p className="text-sm text-[#94A3B8]">
                  {apt.public_reference} · {apt.status}
                </p>
              </div>
              {canManage ? (
                <div className="flex flex-wrap items-center gap-2">
                  {apt.status !== "confirmed" ? (
                    <BookingButton
                      type="button"
                      variant="primary"
                      feedbackKind="confirm"
                      state={buttonFeedback.getState(`confirm-${apt.id}`)}
                      onClick={async () => {
                        setError(null);
                        try {
                          const result = await buttonFeedback.run(`confirm-${apt.id}`, () =>
                            updateBookingAppointmentStatus(apt.id, "confirmed"),
                          );
                          if (!result.ok) setError(result.error ?? "Update failed.");
                          else router.refresh();
                        } catch (err) {
                          setError(bookingActionErrorMessage(err));
                        }
                      }}
                    >
                      Confirmar
                    </BookingButton>
                  ) : null}
                  {apt.status !== "cancelled" ? (
                    <BookingButton
                      type="button"
                      variant="danger"
                      feedbackKind="cancel"
                      state={buttonFeedback.getState(`cancel-${apt.id}`)}
                      onClick={async () => {
                        setError(null);
                        try {
                          const result = await buttonFeedback.run(`cancel-${apt.id}`, () =>
                            updateBookingAppointmentStatus(apt.id, "cancelled"),
                          );
                          if (!result.ok) setError(result.error ?? "Update failed.");
                          else router.refresh();
                        } catch (err) {
                          setError(bookingActionErrorMessage(err));
                        }
                      }}
                    >
                      Cancelar
                    </BookingButton>
                  ) : null}
                  <label className="sr-only" htmlFor={`status-${apt.id}`}>
                    Status
                  </label>
                  <select
                    id={`status-${apt.id}`}
                    className="min-h-10 rounded-lg border border-[#1E293B] bg-[#050816] px-2 py-1 text-sm text-white"
                    value={apt.status}
                    onChange={async (e) => {
                      const status = e.target.value as (typeof BOOKING_APPOINTMENT_STATUSES)[number];
                      if (!BOOKING_APPOINTMENT_STATUSES.includes(status)) return;
                      setError(null);
                      try {
                        const result = await buttonFeedback.run(`status-${apt.id}`, () =>
                          updateBookingAppointmentStatus(apt.id, status),
                        );
                        if (!result.ok) setError(result.error ?? "Update failed.");
                        else router.refresh();
                      } catch (err) {
                        setError(bookingActionErrorMessage(err));
                      }
                    }}
                  >
                    {BOOKING_APPOINTMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}