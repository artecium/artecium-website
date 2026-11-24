"use client";

import {
  cancelGuestAppointmentAction,
  loadGuestAppointmentAction,
  loadPublicDaySlotsForGuestAction,
  rescheduleGuestAppointmentAction,
} from "@/lib/actions/booking/public";
import { formatLocalDateInTimezone } from "@/lib/booking/local-date";
import { BookingButton } from "@/components/booking/BookingButton";
import { useBookingButtonFeedback } from "@/lib/booking/use-booking-button-feedback";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import type { BookingPublicGuestAppointmentView } from "@/types/booking-public";

interface GuestAppointmentManageProps {
  slug: string;
  publicReference: string;
  manageToken: string;
}

export function GuestAppointmentManage({
  slug,
  publicReference,
  manageToken,
}: GuestAppointmentManageProps) {
  const t = useTranslations("booking.public.manage");
  const [view, setView] = useState<BookingPublicGuestAppointmentView | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [localDate, setLocalDate] = useState("");
  const [slots, setSlots] = useState<{ starts_at: string; staff_id: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const cancelFeedback = useBookingButtonFeedback();
  const rescheduleFeedback = useBookingButtonFeedback();

  const load = useCallback(async () => {
    setErrorKey(null);
    const res = await loadGuestAppointmentAction(publicReference, manageToken);
    if (!res.ok) {
      setErrorKey(res.error === "not_found" ? "errors.notFound" : "errors.loadFailed");
      return;
    }
    setView(res.data);
    setLocalDate(formatLocalDateInTimezone(new Date(res.data.starts_at), res.data.timezone));
  }, [manageToken, publicReference]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!view || !localDate) return;
    void loadPublicDaySlotsForGuestAction(slug, view.service_id, view.staff_id, localDate).then((res) => {
      if (res.ok) setSlots(res.data.map((s) => ({ starts_at: s.starts_at, staff_id: s.staff_id })));
      else setSlots([]);
    });
  }, [view, localDate, slug]);

  if (errorKey) {
    return (
      <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
        {t(errorKey as "errors.notFound")}
      </p>
    );
  }

  if (!view) {
    return <p className="text-sm text-[#94A3B8]">{t("loading")}</p>;
  }

  const isTerminal = view.status === "cancelled" || view.status === "rejected";
  const canChange = view.status === "pending" || view.status === "confirmed";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">{view.business_name}</h1>
        <p className="mt-1 font-mono text-sm text-[#64748B]">{publicReference}</p>
      </header>

      <dl className="space-y-2 text-sm text-[#94A3B8]">
        <div>
          <dt className="text-[#64748B]">{t("service")}</dt>
          <dd className="text-white">{view.service_name}</dd>
        </div>
        <div>
          <dt className="text-[#64748B]">{t("when")}</dt>
          <dd className="text-white">
            {new Date(view.starts_at).toLocaleString("pt-PT", { timeZone: view.timezone })}
          </dd>
        </div>
        <div>
          <dt className="text-[#64748B]">{t("status")}</dt>
          <dd className="text-white">{t(`statuses.${view.status}` as "statuses.confirmed")}</dd>
        </div>
      </dl>

      {canChange ? (
        <ManageActions
          cancelFeedback={cancelFeedback}
          rescheduleFeedback={rescheduleFeedback}
          allowReschedule={view.allow_customer_reschedule}
          localDate={localDate}
          setLocalDate={setLocalDate}
          slots={slots}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
          timezone={view.timezone}
          onCancel={async () => {
            cancelFeedback.startLoading();
            try {
              const res = await cancelGuestAppointmentAction(publicReference, manageToken);
              if (!res.ok) {
                cancelFeedback.reset();
                setErrorKey("errors.cancelFailed");
                return;
              }
              cancelFeedback.showSuccess();
              await load();
            } catch {
              cancelFeedback.reset();
              setErrorKey("errors.cancelFailed");
            }
          }}
          onReschedule={async () => {
            if (!selectedSlot) return;
            rescheduleFeedback.startLoading();
            try {
              const res = await rescheduleGuestAppointmentAction(
                publicReference,
                manageToken,
                selectedSlot,
              );
              if (!res.ok) {
                rescheduleFeedback.reset();
                setErrorKey("errors.slotUnavailable");
                return;
              }
              rescheduleFeedback.showSuccess();
              setSelectedSlot(null);
              await load();
            } catch {
              rescheduleFeedback.reset();
              setErrorKey("errors.slotUnavailable");
            }
          }}
          t={t}
        />
      ) : null}

      {isTerminal ? <p className="text-sm text-[#94A3B8]">{t("terminal")}</p> : null}
    </div>
  );
}

function ManageActions({
  cancelFeedback,
  rescheduleFeedback,
  allowReschedule,
  localDate,
  setLocalDate,
  slots,
  selectedSlot,
  setSelectedSlot,
  timezone,
  onCancel,
  onReschedule,
  t,
}: {
  cancelFeedback: ReturnType<typeof useBookingButtonFeedback>;
  rescheduleFeedback: ReturnType<typeof useBookingButtonFeedback>;
  allowReschedule: boolean;
  localDate: string;
  setLocalDate: (v: string) => void;
  slots: { starts_at: string; staff_id: string }[];
  selectedSlot: string | null;
  setSelectedSlot: (v: string | null) => void;
  timezone: string;
  onCancel: () => void | Promise<void>;
  onReschedule: () => void | Promise<void>;
  t: (key: string) => string;
}) {
  const minDate = formatLocalDateInTimezone(new Date(), timezone);

  return (
    <section className="space-y-4 border-t border-[#1E293B] pt-6">
      <h2 className="text-lg font-medium text-white">{t("title")}</h2>
      <BookingButton
        type="button"
        variant="danger"
        feedbackKind="cancel"
        state={cancelFeedback.state}
        onClick={() => void onCancel()}
      >
        {t("cancelBooking")}
      </BookingButton>

      {allowReschedule ? (
        <div className="space-y-3">
          <p className="text-sm text-[#94A3B8]">{t("rescheduleHint")}</p>
          <input
            type="date"
            min={minDate}
            value={localDate}
            onChange={(e) => setLocalDate(e.target.value)}
            className="rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
          />
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {slots.map((slot) => {
              const label = new Date(slot.starts_at).toLocaleTimeString("pt-PT", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: timezone,
              });
              return (
                <li key={slot.starts_at}>
                  <button
                    type="button"
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${
                      selectedSlot === slot.starts_at
                        ? "border-violet-500 bg-violet-500/20 text-white"
                        : "border-[#1E293B] text-[#94A3B8]"
                    }`}
                    onClick={() => setSelectedSlot(slot.starts_at)}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
          <BookingButton
            type="button"
            variant="primary"
            feedbackKind="reschedule"
            state={rescheduleFeedback.state}
            disabled={!selectedSlot}
            onClick={() => void onReschedule()}
          >
            {t("confirmReschedule")}
          </BookingButton>
        </div>
      ) : (
        <p className="text-xs text-[#64748B]">{t("rescheduleDisabled")}</p>
      )}
    </section>
  );
}