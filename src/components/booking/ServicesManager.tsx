"use client";

import {
  createBookingService,
  deleteBookingService,
  updateBookingService,
} from "@/lib/actions/booking/services";
import { BookingButton } from "@/components/booking/BookingButton";
import { bookingActionErrorMessage } from "@/lib/booking/submit-server-action";
import { useBookingButtonFeedbackRegistry } from "@/lib/booking/use-booking-button-feedback";
import { EmptyState } from "@/components/platform/EmptyState";
import type { BookingService } from "@/types/booking";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ServicesManagerProps {
  services: BookingService[];
  canManage: boolean;
}

export function ServicesManager({ services, canManage }: ServicesManagerProps) {
  const t = useTranslations("booking.services");
  const tSettings = useTranslations("booking.settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [formGeneration, setFormGeneration] = useState(0);
  const buttonFeedback = useBookingButtonFeedbackRegistry();

  if (!canManage && services.length === 0) {
    return (
      <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
    );
  }

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
      {services.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <ul className="space-y-3">
          {services.map((service) => (
            <li
              key={service.id}
              className="rounded-xl border border-[#1E293B] bg-[#0E1324]/40 p-4"
            >
              <form
                key={`${service.id}-${formGeneration}`}
                className="space-y-4"
                action={async (fd) => {
                  if (!canManage) return;
                  setError(null);
                  try {
                    const result = await buttonFeedback.run(`save-${service.id}`, () =>
                      updateBookingService(service.id, fd),
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
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <input
                    name="name"
                    defaultValue={service.name}
                    disabled={!canManage}
                    aria-label={t("namePlaceholder")}
                    className="rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white disabled:opacity-60"
                  />
                  <input
                    name="duration_minutes"
                    type="number"
                    min={5}
                    defaultValue={service.duration_minutes}
                    disabled={!canManage}
                    className="rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white disabled:opacity-60"
                  />
                  <input
                    name="price_cents"
                    type="number"
                    min={0}
                    placeholder={t("priceCents")}
                    defaultValue={service.price_cents ?? ""}
                    disabled={!canManage}
                    className="rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white disabled:opacity-60"
                  />
                  <label className="flex items-center gap-2 text-sm text-[#94A3B8]">
                    <input
                      type="checkbox"
                      name="is_active"
                      value="true"
                      defaultChecked={service.is_active}
                      disabled={!canManage}
                    />
                    {t("active")}
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-3 border-t border-[#1E293B] pt-4">
                  {canManage ? (
                    <>
                      <BookingButton
                        type="submit"
                        variant="primary"
                        feedbackKind="save"
                        state={buttonFeedback.getState(`save-${service.id}`)}
                      >
                        {tCommon("save")}
                      </BookingButton>
                      <BookingButton
                        type="button"
                        variant="danger"
                        feedbackKind="delete"
                        state={buttonFeedback.getState(`delete-${service.id}`)}
                        onClick={async () => {
                          setError(null);
                          try {
                            const result = await buttonFeedback.run(
                              `delete-${service.id}`,
                              () => deleteBookingService(service.id),
                            );
                            if (!result.ok) setError(result.error ?? "Delete failed.");
                            else {
                              setFormGeneration((g) => g + 1);
                              router.refresh();
                            }
                          } catch (err) {
                            setError(bookingActionErrorMessage(err));
                          }
                        }}
                      >
                        {tCommon("delete")}
                      </BookingButton>
                    </>
                  ) : (
                    <p className="text-sm text-[#94A3B8]">{tSettings("readOnly")}</p>
                  )}
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}
      {canManage ? (
        <form
          key={`create-${formGeneration}`}
          className="space-y-4 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/[0.04] p-4 sm:p-5"
          action={async (fd) => {
            setError(null);
            try {
              const result = await buttonFeedback.run("create-service", () =>
                createBookingService(fd),
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
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="name"
              required
              placeholder={t("namePlaceholder")}
              className="rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
            />
            <input
              name="duration_minutes"
              type="number"
              min={5}
              defaultValue={30}
              className="rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
            />
          </div>
          <BookingButton
            type="submit"
            variant="primary"
            feedbackKind="create"
            state={buttonFeedback.getState("create-service")}
          >
            {tCommon("create")}
          </BookingButton>
        </form>
      ) : services.length > 0 ? (
        <p className="text-sm text-[#94A3B8]">{tSettings("readOnly")}</p>
      ) : null}
    </div>
  );
}