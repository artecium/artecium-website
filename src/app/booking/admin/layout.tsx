import { AccountMenu } from "@/components/auth/AccountMenu";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { areaHubPath } from "@/lib/auth/entry-routes";
import { getAuthSession } from "@/lib/auth/session";
import { BookingBusinessSwitcher } from "@/components/booking/BookingBusinessSwitcher";
import { buildBookingNavItems } from "@/config/navigation/booking";
import { resolveLocale } from "@/i18n/config";
import { canUseBookingOnboarding } from "@/lib/auth/area-access-policy";
import { getUserAreaAccess } from "@/lib/auth/area-access.server";
import { requireBookingSession } from "@/lib/auth/booking-session";
import { bookingSessionToPlatformProfile } from "@/lib/booking/profile";
import {
  isBookingHostname,
  readBookingAreaHrefContext,
  resolveBookingAreaHref,
} from "@/lib/routing";
import { constructMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("booking.metadata");
  return constructMetadata({
    title: t("title"),
    description: t("description"),
    path: "/booking/admin",
    noIndex: true,
    includeCanonical: false,
  });
}

export default async function BookingAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = resolveLocale(await getLocale());
  const tBooking = await getTranslations("booking");
  const tNav = await getTranslations("booking.nav");
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") ?? "";
  const bookingHrefCtx = readBookingAreaHrefContext((name) => requestHeaders.get(name));
  const onBookingHost = isBookingHostname(bookingHrefCtx.hostname);

  const session = await requireBookingSession();
  const areaAccess = await getUserAreaAccess();
  const isOnboarding =
    pathname.includes("/onboarding") ||
    (onBookingHost && pathname === "/onboarding");

  if (isOnboarding && session.memberships.length > 0) {
    redirect(resolveBookingAreaHref("/booking/admin/dashboard", bookingHrefCtx));
  }

  if (isOnboarding && areaAccess && !canUseBookingOnboarding(areaAccess)) {
    redirect("/acesso?reason=bookingDenied");
  }

  if (!isOnboarding && session.memberships.length === 0) {
    if (areaAccess && !canUseBookingOnboarding(areaAccess)) {
      redirect("/acesso?reason=bookingDenied");
    }
    redirect(resolveBookingAreaHref("/booking/admin/onboarding", bookingHrefCtx));
  }

  if (isOnboarding) {
    const authSession = await getAuthSession();
    const hubLocale = locale === "en" ? "en" : "pt-PT";

    return (
      <div className="min-h-full bg-[#050816] text-white">
        <header className="flex items-center justify-between gap-3 border-b border-[#1E293B] px-4 py-4 sm:px-6">
          <p className="text-xs uppercase tracking-widest text-[#64748B]">
            {tBooking("areaLabel")}
          </p>
          {authSession ? (
            <AccountMenu
              displayName={authSession.profile.full_name ?? ""}
              email={authSession.profile.email}
              workspacesHref={areaHubPath(hubLocale)}
              variant="header"
            />
          ) : null}
        </header>
        <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">{children}</main>
      </div>
    );
  }

  const profile = bookingSessionToPlatformProfile(session);

  return (
    <PlatformShell
      profile={profile}
      navItems={buildBookingNavItems((key) => tNav(key), bookingHrefCtx.hostname, {
        requestPathname: bookingHrefCtx.requestPathname,
      })}
      areaTitle={tBooking("areaTitle")}
      areaLabel={tBooking("areaLabel")}
      homeHref={resolveBookingAreaHref("/booking/admin/dashboard", bookingHrefCtx)}
      locale={locale}
      navPathMatch="booking"
    >
      <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
        <BookingBusinessSwitcher
          memberships={session.memberships}
          activeBusinessId={session.activeBusinessId}
        />
      </div>
      {children}
    </PlatformShell>
  );
}
