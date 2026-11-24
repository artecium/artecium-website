import { SchedulesManager } from "@/components/booking/SchedulesManager";
import { PageHeader } from "@/components/platform/PageHeader";
import { requireBookingSession } from "@/lib/auth/booking-session";
import { listBookingStaff, listStaffBreaks, listWorkingHours } from "@/lib/data/booking";
import { getTranslations } from "next-intl/server";

export default async function BookingSchedulesPage({
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
  const [hours, breaks] = staffId
    ? await Promise.all([listWorkingHours(staffId), listStaffBreaks(staffId)])
    : [[], []];
  const t = await getTranslations("booking.schedules");

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <SchedulesManager
        staff={staff}
        initialStaffId={staffId}
        workingHours={hours}
        breaks={breaks}
        canManage={session.canManageActiveBusiness}
      />
    </>
  );
}
