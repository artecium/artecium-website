import { SettingsForm } from "@/components/booking/SettingsForm";
import { PageHeader } from "@/components/platform/PageHeader";
import { requireBookingSession } from "@/lib/auth/booking-session";
import { getBookingBusiness } from "@/lib/data/booking";
import { getTranslations } from "next-intl/server";

export default async function BookingSettingsPage() {
  const session = await requireBookingSession({ requireBusiness: true });
  const business = await getBookingBusiness(session.activeBusinessId!);
  const t = await getTranslations("booking.settings");

  if (!business) {
    return <p className="text-sm text-[#94A3B8]">{t("notFound")}</p>;
  }

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <SettingsForm business={business} canManage={session.canManageActiveBusiness} />
    </>
  );
}
