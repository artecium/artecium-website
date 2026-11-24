"use client";

import {
  createPublicAppointmentAction,
  loadPublicDaySlotsAction,
  loadPublicStaffAction,
} from "@/lib/actions/booking/public";
import { formatLocalDateInTimezone } from "@/lib/booking/local-date";
import { isValidPublicIdempotencyKey } from "@/lib/booking/public-idempotency";
import type {
  BookingPublicBusiness,
  BookingPublicService,
  BookingPublicStaffOption,
} from "@/types/booking-public";
import { BookingButton } from "@/components/booking/BookingButton";
import {
  BOOKING_BUTTON_SUCCESS_MS,
  useBookingButtonFeedback,
} from "@/lib/booking/use-booking-button-feedback";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

const AUTO_STAFF = "__auto__";

type Step = "service" | "staff" | "date" | "time" | "details" | "review" | "done";

interface PublicBookingWizardProps {
  business: BookingPublicBusiness;
  slug: string;
  initialServices: BookingPublicService[];
  dataAvailable: boolean;
}

function formatMoney(cents: number | null, currency: string, locale: string): string {
  if (cents == null) return "";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}

export function PublicBookingWizard({
  business,
  slug,
  initialServices,
  dataAvailable,
}: PublicBookingWizardProps) {
  const t = useTranslations("booking.public");
  const locale = business.default_locale === "en" ? "en" : "pt-PT";

  const [step, setStep] = useState<Step>("service");
  const [serviceId, setServiceId] = useState<string>("");
  const [staffMode, setStaffMode] = useState<string>(AUTO_STAFF);
  const [staffList, setStaffList] = useState<BookingPublicStaffOption[]>([]);
  const [localDate, setLocalDate] = useState("");
  const [slots, setSlots] = useState<{ starts_at: string; staff_id: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ starts_at: string; staff_id: string } | null>(
    null,
  );
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [result, setResult] = useState<{
    public_reference: string;
    status: string;
    starts_at: string;
    ends_at: string;
    manage_token?: string | null;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const confirmFeedback = useBookingButtonFeedback();

  const idempotencyKey = useMemo(() => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    }
    return `bk_${Date.now()}_${Math.random().toString(36).slice(2, 18)}`;
  }, []);

  const selectedService = initialServices.find((s) => s.id === serviceId);

  const minDate = useMemo(
    () => formatLocalDateInTimezone(new Date(), business.timezone),
    [business.timezone],
  );

  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + business.max_booking_days);
    return formatLocalDateInTimezone(d, business.timezone);
  }, [business.max_booking_days, business.timezone]);

  const loadStaff = useCallback(
    (svcId: string) => {
      startTransition(async () => {
        setErrorKey(null);
        const res = await loadPublicStaffAction(slug, svcId);
        if (!res.ok) {
          setErrorKey(
            res.error === "not_configured" ? "errors.notConfigured" : "errors.loadFailed",
          );
          setStaffList([]);
          return;
        }
        setStaffList(res.data);
      });
    },
    [slug],
  );

  const loadSlots = useCallback(() => {
    if (!serviceId || !localDate) return;
    const staffParam = staffMode === AUTO_STAFF ? null : staffMode;
    startTransition(async () => {
      setErrorKey(null);
      setSlots([]);
      setSelectedSlot(null);
      const res = await loadPublicDaySlotsAction(slug, serviceId, staffParam, localDate);
      if (!res.ok) {
        setErrorKey(
          res.error === "not_configured" ? "errors.notConfigured" : "errors.loadFailed",
        );
        return;
      }
      setSlots(res.data);
    });
  }, [slug, serviceId, staffMode, localDate]);

  useEffect(() => {
    if (step === "time" && serviceId && localDate) {
      loadSlots();
    }
  }, [step, serviceId, localDate, loadSlots]);

  if (!dataAvailable) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-6 text-sm text-amber-100">
        {t("errors.notConfigured")}
      </div>
    );
  }

  if (initialServices.length === 0) {
    return (
      <div className="rounded-xl border border-[#1E293B] bg-[#0E1324]/60 px-4 py-8 text-center text-[#94A3B8]">
        {t("empty.noServices")}
      </div>
    );
  }

  if (step === "done" && result) {
    const pendingApproval = result.status === "pending";
    return (
      <div className="space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-8">
        <h2 className="text-xl font-semibold text-white">
          {pendingApproval ? t("success.pendingTitle") : t("success.confirmedTitle")}
        </h2>
        <p className="text-sm text-[#94A3B8]">
          {pendingApproval ? t("success.pendingDescription") : t("success.confirmedDescription")}
        </p>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-[#64748B]">{t("success.reference")}</dt>
            <dd className="font-mono text-white">{result.public_reference}</dd>
          </div>
          <div>
            <dt className="text-[#64748B]">{t("success.when")}</dt>
            <dd className="text-white">
              {new Date(result.starts_at).toLocaleString(locale, { timeZone: business.timezone })}
            </dd>
          </div>
        </dl>
        {result.manage_token ? (
          <p className="text-sm text-[#94A3B8]">
            <a
              className="text-violet-300 underline"
              href={`/booking/b/${slug}/manage?ref=${encodeURIComponent(result.public_reference)}&token=${encodeURIComponent(result.manage_token)}`}
            >
              {t("success.manageLink")}
            </a>
            <span className="mt-1 block text-xs text-amber-200/90">{t("success.manageTokenOnce")}</span>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {errorKey ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {t(errorKey as "errors.generic")}
        </p>
      ) : null}

      {step === "service" && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-white">{t("steps.service")}</h2>
          <ul className="space-y-2">
            {initialServices.map((svc) => (
              <li key={svc.id}>
                <button
                  type="button"
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    serviceId === svc.id
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-[#1E293B] bg-[#0E1324]/40 hover:border-[#334155]"
                  }`}
                  onClick={() => {
                    setServiceId(svc.id);
                    loadStaff(svc.id);
                  }}
                >
                  <span className="font-medium text-white">{svc.name}</span>
                  <span className="mt-1 block text-sm text-[#94A3B8]">
                    {t("serviceDuration", { minutes: svc.duration_minutes })}
                    {svc.price_cents != null
                      ? ` · ${formatMoney(svc.price_cents, business.currency, locale)}`
                      : ""}
                  </span>
                  {svc.description ? (
                    <span className="mt-1 block text-xs text-[#64748B]">{svc.description}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          <BookingButton
            type="button"
            variant="primary"
            feedbackKind="submit"
            state="idle"
            disabled={!serviceId || pending}
            onClick={() => setStep("staff")}
          >
            {t("actions.continue")}
          </BookingButton>
        </section>
      )}

      {step === "staff" && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-white">{t("steps.staff")}</h2>
          <label className="flex items-center gap-2 rounded-xl border border-[#1E293B] px-4 py-3">
            <input
              type="radio"
              name="staff"
              checked={staffMode === AUTO_STAFF}
              onChange={() => setStaffMode(AUTO_STAFF)}
            />
            <span className="text-sm text-white">{t("staffAuto")}</span>
          </label>
          {staffList.map((st) => (
            <label
              key={st.id}
              className="flex items-center gap-2 rounded-xl border border-[#1E293B] px-4 py-3"
            >
              <input
                type="radio"
                name="staff"
                checked={staffMode === st.id}
                onChange={() => setStaffMode(st.id)}
              />
              <span className="text-sm text-white">{st.display_name}</span>
            </label>
          ))}
          {staffList.length === 0 && !pending ? (
            <p className="text-sm text-[#94A3B8]">{t("empty.noStaff")}</p>
          ) : null}
          <div className="flex gap-2">
            <BookingButton type="button" variant="ghost" feedbackKind="submit" state="idle" onClick={() => setStep("service")}>
              {t("actions.back")}
            </BookingButton>
            <BookingButton
              type="button"
              variant="primary"
              feedbackKind="submit"
              state="idle"
              disabled={staffMode !== AUTO_STAFF && staffList.length === 0}
              onClick={() => setStep("date")}
            >
              {t("actions.continue")}
            </BookingButton>
          </div>
        </section>
      )}

      {step === "date" && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-white">{t("steps.date")}</h2>
          <input
            type="date"
            min={minDate}
            max={maxDate}
            value={localDate}
            onChange={(e) => setLocalDate(e.target.value)}
            className="w-full rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
          />
          <div className="flex gap-2">
            <BookingButton type="button" variant="ghost" feedbackKind="submit" state="idle" onClick={() => setStep("staff")}>
              {t("actions.back")}
            </BookingButton>
            <BookingButton
              type="button"
              variant="primary"
              feedbackKind="submit"
              state="idle"
              disabled={!localDate}
              onClick={() => {
                setStep("time");
                loadSlots();
              }}
            >
              {t("actions.continue")}
            </BookingButton>
          </div>
        </section>
      )}

      {step === "time" && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-white">{t("steps.time")}</h2>
          {pending ? (
            <p className="text-sm text-[#94A3B8]">{t("loading.slots")}</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">{t("empty.noSlots")}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((slot) => {
                const label = new Date(slot.starts_at).toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: business.timezone,
                });
                const staffName =
                  staffMode === AUTO_STAFF
                    ? staffList.find((s) => s.id === slot.staff_id)?.display_name
                    : null;
                const key = `${slot.starts_at}-${slot.staff_id}`;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${
                        selectedSlot?.starts_at === slot.starts_at &&
                        selectedSlot?.staff_id === slot.staff_id
                          ? "border-violet-500 bg-violet-500/20 text-white"
                          : "border-[#1E293B] text-[#94A3B8]"
                      }`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {label}
                      {staffName ? (
                        <span className="block text-xs opacity-80">{staffName}</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex gap-2">
            <BookingButton type="button" variant="ghost" feedbackKind="submit" state="idle" onClick={() => setStep("date")}>
              {t("actions.back")}
            </BookingButton>
            <BookingButton
              type="button"
              variant="primary"
              feedbackKind="submit"
              state="idle"
              disabled={!selectedSlot}
              onClick={() => setStep("details")}
            >
              {t("actions.continue")}
            </BookingButton>
          </div>
        </section>
      )}

      {step === "details" && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-white">{t("steps.details")}</h2>
          <input
            required
            placeholder={t("fields.name")}
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
          />
          <input
            type="email"
            placeholder={t("fields.emailOptional")}
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="w-full rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
          />
          <input
            type="tel"
            placeholder={t("fields.phoneOptional")}
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="w-full rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
          />
          <div className="flex gap-2">
            <BookingButton type="button" variant="ghost" feedbackKind="submit" state="idle" onClick={() => setStep("time")}>
              {t("actions.back")}
            </BookingButton>
            <BookingButton
              type="button"
              variant="primary"
              feedbackKind="submit"
              state="idle"
              disabled={!guestName.trim()}
              onClick={() => setStep("review")}
            >
              {t("actions.continue")}
            </BookingButton>
          </div>
        </section>
      )}

      {step === "review" && selectedService && selectedSlot && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-white">{t("steps.review")}</h2>
          <ul className="space-y-2 text-sm text-[#94A3B8]">
            <li>
              <span className="text-[#64748B]">{t("review.service")}: </span>
              {selectedService.name}
            </li>
            <li>
              <span className="text-[#64748B]">{t("review.when")}: </span>
              {new Date(selectedSlot.starts_at).toLocaleString(locale, {
                timeZone: business.timezone,
              })}
            </li>
            <li>
              <span className="text-[#64748B]">{t("review.duration")}: </span>
              {t("serviceDuration", { minutes: selectedService.duration_minutes })}
            </li>
            <li>
              <span className="text-[#64748B]">{t("review.name")}: </span>
              {guestName}
            </li>
          </ul>
          {business.confirmation_mode === "manual" ? (
            <p className="text-xs text-[#64748B]">{t("review.manualNotice")}</p>
          ) : null}
          <div className="flex gap-2">
            <BookingButton type="button" variant="ghost" feedbackKind="submit" state="idle" onClick={() => setStep("details")}>
              {t("actions.back")}
            </BookingButton>
            <BookingButton
              type="button"
              variant="primary"
              feedbackKind="confirm"
              state={confirmFeedback.state}
              disabled={pending || !isValidPublicIdempotencyKey(idempotencyKey)}
              onClick={() => {
                setErrorKey(null);
                confirmFeedback.startLoading();
                startTransition(async () => {
                  const res = await createPublicAppointmentAction({
                    businessSlug: slug,
                    serviceId,
                    staffId: selectedSlot.staff_id,
                    startsAtIso: selectedSlot.starts_at,
                    guestName,
                    guestEmail,
                    guestPhone,
                    idempotencyKey,
                  });
                  if (!res.ok) {
                    confirmFeedback.reset();
                    const raw = res.errorCode.replace(/^booking\.public\./, "");
                    const key = raw.startsWith("errors.") ? raw : `errors.${raw.replace(/^errors\./, "")}`;
                    setErrorKey(key);
                    return;
                  }
                  confirmFeedback.showSuccess();
                  window.setTimeout(() => {
                    setResult(res.data);
                    setStep("done");
                  }, BOOKING_BUTTON_SUCCESS_MS);
                });
              }}
            >
              {t("actions.confirmBooking")}
            </BookingButton>
          </div>
        </section>
      )}
    </div>
  );
}
