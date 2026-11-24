import { TimeOffManager } from "@/components/booking/TimeOffManager";
import { PageHeader } from "@/components/platform/PageHeader";
import { requireBookingSession } from "@/lib/auth/booking-session";
import { listBookingStaff, listTimeOff, type BookingTimeOffRow } from "@/lib/data/booking";
import { listMemberStaffTimeOffIntervals } from "@/lib/data/booking/member-busy-intervals";
import { listOwnBookingStaffIds } from "@/lib/data/booking/staff-ids";
import { getTranslations } from "next-intl/server";

export default async function BookingTimeOffPage({
  searchParams,
}: {
  searchParams: Promise<{ staff?: string }>;
}) {
  const session = await requireBookingSession({ requireBusiness: true });
  const businessId = session.activeBusinessId!;
  const staff = await listBookingStaff(businessId);
  const { staff: staffParam } = await searchParams;
  const staffId =
    staff.find((s) => s.id === staffParam)?.id ?? staff[0]?.id ?? null;
  const ownStaffIds = session.canManageActiveBusiness
    ? []
    : await listOwnBookingStaffIds(businessId, session.userId);
  const includeLabel =
    session.canManageActiveBusiness ||
    (staffId != null && ownStaffIds.includes(staffId));
  let timeOff: BookingTimeOffRow[] = [];
  if (staffId) {
    if (includeLabel) {
      timeOff = await listTimeOff(staffId, { includeLabel: true });
    } else {
      const rangeStart = new Date(Date.now() - 14 * 86400000).toISOString();
      const rangeEnd = new Date(Date.now() + 17 * 86400000).toISOString();
      const blocks = await listMemberStaffTimeOffIntervals(
        businessId,
        rangeStart,
        rangeEnd,
        [staffId],
      );
      timeOff = blocks.map((b) => ({
        id: `${b.staff_id}-${b.starts_at}`,
        staff_id: b.staff_id,
        starts_at: b.starts_at,
        ends_at: b.ends_at,
        label: null,
      }));
    }
  }
  const t = await getTranslations("booking.timeOff");

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <TimeOffManager
        staff={staff}
        initialStaffId={staffId}
        timeOff={timeOff}
        canManage={session.canManageActiveBusiness}
      />
    </>
  );
}
