import { PublicBookingWizard } from "@/components/booking/public/PublicBookingWizard";
import { isSupabaseConfigured } from "@/lib/booking/public-errors";
import { fetchPublicBusiness, fetchPublicServices } from "@/lib/data/booking/public";
import { isValidBusinessSlug } from "@/lib/routing/booking-host";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface BookingPublicBusinessPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BookingPublicBusinessPageProps) {
  const { slug } = await params;
  const t = await getTranslations("booking.public");
  if (!isValidBusinessSlug(slug)) {
    return { title: t("meta.notFound") };
  }
  const businessRes = await fetchPublicBusiness(slug);
  if (!businessRes.ok) {
    return { title: t("meta.notFound") };
  }
  return {
    title: `${businessRes.data.name} — ${t("meta.book")}`,
    description: businessRes.data.public_description ?? t("meta.description"),
  };
}

export default async function BookingPublicBusinessPage({
  params,
}: BookingPublicBusinessPageProps) {
  const { slug } = await params;
  if (!isValidBusinessSlug(slug)) {
    notFound();
  }

  const t = await getTranslations("booking.public");
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <>
        <h1 className="text-2xl font-semibold capitalize">{slug.replace(/-/g, " ")}</h1>
        <p className="mt-4 text-sm text-amber-200">{t("errors.notConfigured")}</p>
      </>
    );
  }

  const [businessRes, servicesRes] = await Promise.all([
    fetchPublicBusiness(slug),
    fetchPublicServices(slug),
  ]);

  if (!businessRes.ok && businessRes.error === "not_found") {
    notFound();
  }

  if (!businessRes.ok) {
    return (
      <>
        <h1 className="text-2xl font-semibold">{t("errors.loadFailed")}</h1>
        <p className="mt-2 text-sm text-[#94A3B8]">{t("errors.loadFailedHint")}</p>
      </>
    );
  }

  const business = businessRes.data;
  const services = servicesRes.ok ? servicesRes.data : [];

  return (
    <>
      <header className="mb-8">
        {business.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logo_url}
            alt=""
            className="mb-4 h-12 w-auto object-contain"
          />
        ) : null}
        <h1 className="text-2xl font-semibold sm:text-3xl" style={{ color: business.brand_color ?? undefined }}>
          {business.name}
        </h1>
        {business.public_description ? (
          <p className="mt-3 text-sm leading-relaxed text-[#94A3B8]">{business.public_description}</p>
        ) : null}
      </header>
      <PublicBookingWizard
        business={business}
        slug={slug}
        initialServices={services}
        dataAvailable={businessRes.ok && servicesRes.ok}
      />
    </>
  );
}
