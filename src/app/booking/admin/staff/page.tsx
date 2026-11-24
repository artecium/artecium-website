import { StaffManager } from "@/components/booking/StaffManager";
import { PageHeader } from "@/components/platform/PageHeader";
import { requireBookingSession } from "@/lib/auth/booking-session";
import { listBookingServices, listBookingStaff, listStaffServiceIds } from "@/lib/data/booking";
import { getTranslations } from "next-intl/server";

export default async function BookingStaffPage() {
  const session = await requireBookingSession({ requireBusiness: true });
  const businessId = session.activeBusinessId!;
  const [staff, services] = await Promise.all([
    listBookingStaff(businessId),
    listBookingServices(businessId),
  ]);
  const serviceMap = new Map<string, string[]>();
  await Promise.all(
    staff.map(async (s) => {
      serviceMap.set(s.id, await listStaffServiceIds(s.id));
    }),
  );
  const t = await getTranslations("booking.staff");

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <StaffManager
        staff={staff}
        services={services}
        staffServiceIds={Object.fromEntries(serviceMap)}
        canManage={session.canManageActiveBusiness}
      />
    </>
  );
}
