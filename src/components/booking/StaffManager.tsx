"use client";

import {
  createBookingStaff,
  setBookingStaffServices,
  updateBookingStaff,
} from "@/lib/actions/booking/staff";
import { BookingButton } from "@/components/booking/BookingButton";
import { bookingActionErrorMessage } from "@/lib/booking/submit-server-action";
import { useBookingButtonFeedbackRegistry } from "@/lib/booking/use-booking-button-feedback";
import { EmptyState } from "@/components/platform/EmptyState";
import type { BookingService, BookingStaff } from "@/types/booking";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface StaffManagerProps {
  staff: BookingStaff[];
  services: BookingService[];
  staffServiceIds: Record<string, string[]>;
  canManage: boolean;
}

export function StaffManager({
  staff,
  services,
  staffServiceIds,
  canManage,
}: StaffManagerProps) {
  const t = useTranslations("booking.staff");
  const tSettings = useTranslations("booking.settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [formGeneration, setFormGeneration] = useState(0);
  const buttonFeedback = useBookingButtonFeedbackRegistry();

  return (
    <div className="space-y-8">
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {error}
        </p>
      ) : null}
      {staff.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <ul className="space-y-4">
          {staff.map((member) => (
            <li
              key={member.id}
              className="rounded-xl border border-[#1E293B] bg-[#0E1324]/40 p-4"
            >
              <form
                key={`${member.id}-profile-${formGeneration}`}
                className="space-y-4"
                action={async (fd) => {
                  if (!canManage) return;
                  setError(null);
                  try {
                    const result = await buttonFeedback.run(`save-staff-${member.id}`, () =>
                      updateBookingStaff(member.id, fd),
                    );
                    if (!result.ok) setError(result.error ?? "Save failed.");
                    else {
                      setFormGeneration((g) => g + 1);
                      router.refresh();
                    }
                  } catch (err) {
                    setError(bookingActionErrorMessage(err));
                  }
                }}
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    name="display_name"
                    defaultValue={member.display_name}
                    disabled={!canManage}
                    placeholder={t("namePlaceholder")}
                    className="rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
                  />
                  <input
                    name="email"
                    type="email"
                    defaultValue={member.email ?? ""}
                    disabled={!canManage}
                    placeholder={tCommon("email")}
                    className="rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
                  />
                  <input
                    name="profile_id"
                    defaultValue={member.profile_id ?? ""}
                    disabled={!canManage}
                    placeholder={t("profileIdOptional")}
                    className="rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white md:col-span-2"
                  />
                  <label className="flex items-center gap-2 text-sm text-[#94A3B8] md:col-span-2">
                    <input
                      type="checkbox"
                      name="accepts_online_bookings"
                      value="true"
                      defaultChecked={member.accepts_online_bookings}
                      disabled={!canManage}
                    />
                    {t("acceptsOnline")}
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-3 border-t border-[#1E293B] pt-4">
                  {canManage ? (
                    <BookingButton
                      type="submit"
                      variant="primary"
                      feedbackKind="save"
                      state={buttonFeedback.getState(`save-staff-${member.id}`)}
                    >
                      {tCommon("save")}
                    </BookingButton>
                  ) : (
                    <p className="text-sm text-[#94A3B8]">{tSettings("readOnly")}</p>
                  )}
                </div>
              </form>
              {services.length > 0 ? (
                <form
                  key={`${member.id}-services-${formGeneration}`}
                  className="mt-4 border-t border-[#1E293B] pt-4"
                  action={async (fd) => {
                    if (!canManage) return;
                    const selected = fd
                      .getAll("service_ids")
                      .map(String)
                      .filter(Boolean);
                    setError(null);
                    try {
                      const result = await buttonFeedback.run(
                        `staff-services-${member.id}`,
                        () => setBookingStaffServices(member.id, selected),
                      );
                      if (!result.ok) setError(result.error ?? "Save failed.");
                      else {
                        setFormGeneration((g) => g + 1);
                        router.refresh();
                      }
                    } catch (err) {
                      setError(bookingActionErrorMessage(err));
                    }
                  }}
                >
                  <p className="mb-2 text-sm text-[#94A3B8]">{t("services")}</p>
                  <div className="flex flex-wrap gap-3">
                    {services.map((svc) => (
                      <label key={svc.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="service_ids"
                          value={svc.id}
                          defaultChecked={(staffServiceIds[member.id] ?? []).includes(
                            svc.id,
                          )}
                          disabled={!canManage}
                        />
                        {svc.name}
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {canManage ? (
                      <BookingButton
                        type="submit"
                        variant="secondary"
                        feedbackKind="associate"
                        state={buttonFeedback.getState(`staff-services-${member.id}`)}
                      >
                        {t("saveServices")}
                      </BookingButton>
                    ) : (
                      <p className="text-sm text-[#94A3B8]">{tSettings("readOnly")}</p>
                    )}
                  </div>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {canManage ? (
        <form
          key={`create-staff-${formGeneration}`}
          className="space-y-4 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/[0.04] p-4 sm:p-5"
          action={async (fd) => {
            setError(null);
            try {
              const result = await buttonFeedback.run("create-staff", () =>
                createBookingStaff(fd),
              );
              if (!result.ok) setError(result.error ?? "Create failed.");
              else {
                setFormGeneration((g) => g + 1);
                router.refresh();
              }
            } catch (err) {
              setError(bookingActionErrorMessage(err));
            }
          }}
        >
          <h3 className="text-base font-semibold text-white">{t("add")}</h3>
          <input
            name="display_name"
            required
            placeholder={t("namePlaceholder")}
            className="w-full rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
          />
          <BookingButton
            type="submit"
            variant="primary"
            feedbackKind="create"
            state={buttonFeedback.getState("create-staff")}
          >
            {tCommon("create")}
          </BookingButton>
        </form>
      ) : staff.length > 0 ? (
        <p className="text-sm text-[#94A3B8]">{tSettings("readOnly")}</p>
      ) : null}
    </div>
  );
}