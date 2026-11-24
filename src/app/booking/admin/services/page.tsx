import { ServicesManager } from "@/components/booking/ServicesManager";
import { PageHeader } from "@/components/platform/PageHeader";
import { requireBookingSession } from "@/lib/auth/booking-session";
import { listBookingServices } from "@/lib/data/booking";
import { getTranslations } from "next-intl/server";

export default async function BookingServicesPage() {
  const session = await requireBookingSession({ requireBusiness: true });
  const services = await listBookingServices(session.activeBusinessId!);
  const t = await getTranslations("booking.services");

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <ServicesManager services={services} canManage={session.canManageActiveBusiness} />
    </>
  );
}
