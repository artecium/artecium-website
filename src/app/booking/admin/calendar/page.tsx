import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { PageHeader } from "@/components/platform/PageHeader";
import { requireBookingSession } from "@/lib/auth/booking-session";
import {
  listBookingAppointments,
  listBookingStaff,
  listMemberStaffBusyIntervalsForRange,
} from "@/lib/data/booking";
import { readBookingAreaHrefContext, resolveBookingAreaHref } from "@/lib/routing";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export default async function BookingCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const session = await requireBookingSession({ requireBusiness: true });
  const businessId = session.activeBusinessId!;
  const { view: viewParam, date: dateParam } = await searchParams;
  const view =
    viewParam === "week" || viewParam === "month" || viewParam === "day"
      ? viewParam
      : "week";
  const anchorDate = dateParam?.match(/^\d{4}-\d{2}-\d{2}$/)
    ? dateParam
    : new Date().toISOString().slice(0, 10);

  const anchor = new Date(`${anchorDate}T12:00:00`);
  let from = anchorDate;
  let to = anchorDate;
  if (view === "week") {
    const day = anchor.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(anchor);
    start.setDate(anchor.getDate() + diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    from = start.toISOString().slice(0, 10);
    to = `${end.toISOString().slice(0, 10)}T23:59:59.999Z`;
  } else if (view === "month") {
    from = new Date(anchor.getFullYear(), anchor.getMonth(), 1).toISOString();
    to = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 23, 59, 59).toISOString();
  } else {
    to = `${anchorDate}T23:59:59.999Z`;
  }

  const rangeStart = from.includes("T") ? from : `${from}T00:00:00.000Z`;
  const rangeEnd = to.includes("T") ? to : `${to}T23:59:59.999Z`;

  const [appointments, staff, colleagueBusy] = await Promise.all([
    listBookingAppointments(businessId, from, to),
    session.canManageActiveBusiness ? Promise.resolve([]) : listBookingStaff(businessId),
    session.canManageActiveBusiness
      ? Promise.resolve([])
      : listMemberStaffBusyIntervalsForRange(businessId, rangeStart, rangeEnd, null),
  ]);

  const staffNames = new Map(staff.map((s) => [s.id, s.display_name]));
  const t = await getTranslations("booking.calendar");
  const requestHeaders = await headers();
  const bookingHrefCtx = readBookingAreaHrefContext((name) => requestHeaders.get(name));
  const baseHref = resolveBookingAreaHref("/booking/admin/calendar", bookingHrefCtx);

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <BookingCalendar
        appointments={appointments}
        colleagueBusy={colleagueBusy}
        staffNames={staffNames}
        view={view}
        anchorDate={anchorDate}
        baseHref={baseHref}
        labels={{
          day: t("viewDay"),
          week: t("viewWeek"),
          month: t("viewMonth"),
          noAppointments: t("noAppointments"),
          colleagueBusy: t("colleagueBusy"),
        }}
      />
    </>
  );
}
