import { AppointmentsManager } from "@/components/booking/AppointmentsManager";
import { PageHeader } from "@/components/platform/PageHeader";
import { requireBookingSession } from "@/lib/auth/booking-session";
import { listBookingAppointments } from "@/lib/data/booking";
import { getTranslations } from "next-intl/server";

export default async function BookingAppointmentsPage() {
  const session = await requireBookingSession({ requireBusiness: true });
  const businessId = session.activeBusinessId!;
  const from = new Date(Date.now() - 30 * 86400000).toISOString();
  const to = new Date(Date.now() + 90 * 86400000).toISOString();
  const appointments = await listBookingAppointments(businessId, from, to);
  const t = await getTranslations("booking.appointments");

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <AppointmentsManager
        appointments={appointments}
        canManage={session.canManageActiveBusiness}
      />
    </>
  );
}
