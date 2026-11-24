import { GuestAppointmentManage } from "@/components/booking/public/GuestAppointmentManage";
import { isValidBusinessSlug } from "@/lib/routing/booking-host";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface ManagePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string; token?: string }>;
}

export async function generateMetadata() {
  const t = await getTranslations("booking.public.manage");
  return { title: t("metaTitle") };
}

export default async function GuestManageBookingPage({ params, searchParams }: ManagePageProps) {
  const { slug } = await params;
  const { ref, token } = await searchParams;

  if (!isValidBusinessSlug(slug)) notFound();
  if (!ref?.trim() || !token?.trim()) notFound();

  return (
    <GuestAppointmentManage slug={slug} publicReference={ref.trim()} manageToken={token.trim()} />
  );
}