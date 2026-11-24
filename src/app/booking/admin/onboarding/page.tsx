import { OnboardingForm } from "@/components/booking/OnboardingForm";
import { PageHeader } from "@/components/platform/PageHeader";
import { getTranslations } from "next-intl/server";

export default async function BookingOnboardingPage() {
  const t = await getTranslations("booking.onboarding");

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <OnboardingForm />
    </>
  );
}
