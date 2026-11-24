import { TeamInviteForm } from "@/components/booking/TeamInviteForm";
import { PageHeader } from "@/components/platform/PageHeader";
import { requireBookingSession } from "@/lib/auth/booking-session";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { readBookingAreaHrefContext, resolveBookingAreaHref } from "@/lib/routing";
import { headers } from "next/headers";

export default async function BookingTeamPage() {
  const session = await requireBookingSession({ requireBusiness: true });
  const t = await getTranslations("booking.team");
  const requestHeaders = await headers();
  const bookingHrefCtx = readBookingAreaHrefContext((name) => requestHeaders.get(name));

  if (!session.canManageActiveBusiness) {
    redirect(resolveBookingAreaHref("/booking/admin/dashboard", bookingHrefCtx));
  }

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <TeamInviteForm />
    </>
  );
}
