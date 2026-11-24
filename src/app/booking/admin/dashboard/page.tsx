import { BookingStatGrid } from "@/components/booking/BookingStatGrid";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { requireBookingSession } from "@/lib/auth/booking-session";
import {
  getBookingBusiness,
  getBookingDashboardStats,
  listBookingAppointments,
} from "@/lib/data/booking";
import { listOwnBookingStaffIds } from "@/lib/data/booking/staff-ids";
import { readBookingAreaHrefContext, resolveBookingAreaHref } from "@/lib/routing";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { BookingActionLink } from "@/components/booking/BookingActionLink";

export default async function BookingAdminDashboardPage() {
  const session = await requireBookingSession({ requireBusiness: true });
  const businessId = session.activeBusinessId!;
  const t = await getTranslations("booking.dashboard");
  const requestHeaders = await headers();
  const bookingHrefCtx = readBookingAreaHrefContext((name) => requestHeaders.get(name));

  const appointmentScope = session.canManageActiveBusiness ? "business" : "own_staff";
  const ownStaffIds =
    appointmentScope === "own_staff"
      ? await listOwnBookingStaffIds(businessId, session.userId)
      : [];

  const [business, stats, upcoming] = await Promise.all([
    getBookingBusiness(businessId),
    getBookingDashboardStats(businessId, {
      appointmentScope,
      ownStaffIds,
    }),
    listBookingAppointments(
      businessId,
      new Date().toISOString(),
      new Date(Date.now() + 14 * 86400000).toISOString(),
    ),
  ]);

  const statItems = [
    { label: t("stats.services"), value: stats.activeServices },
    { label: t("stats.staff"), value: stats.activeStaff },
    { label: t("stats.pending"), value: stats.pendingAppointments },
    { label: t("stats.today"), value: stats.appointmentsToday },
  ];

  const needsSetup = stats.activeServices === 0 || stats.activeStaff === 0;

  return (
    <>
      <PageHeader
        title={business?.name ?? t("title")}
        description={t("description")}
      />
      <BookingStatGrid stats={statItems} />
      {needsSetup ? (
        <div className="mt-8">
          <EmptyState
            title={t("setup.title")}
            description={t("setup.description")}
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <BookingActionLink
                  href={resolveBookingAreaHref("/booking/admin/services", bookingHrefCtx)}
                  variant="primary"
                >
                  {t("setup.services")}
                </BookingActionLink>
                <BookingActionLink
                  href={resolveBookingAreaHref("/booking/admin/staff", bookingHrefCtx)}
                  variant="secondary"
                >
                  {t("setup.staff")}
                </BookingActionLink>
              </div>
            }
          />
        </div>
      ) : null}
      <section className="mt-10">
        <h2 className="text-lg font-medium text-white">{t("upcoming")}</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-[#94A3B8]">{t("noUpcoming")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {upcoming.slice(0, 8).map((apt) => (
              <li
                key={apt.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#1E293B] px-4 py-3 text-sm"
              >
                <span className="text-white">
                  {new Date(apt.starts_at).toLocaleString()} · {apt.guest_name ?? "—"}
                </span>
                <span className="text-[#94A3B8]">{apt.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
