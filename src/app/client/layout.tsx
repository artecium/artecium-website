import { logClientRouteBeacon } from "@/lib/dev/client-route-diagnostic";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { buildClientNavSections } from "@/config/navigation/platform";
import { getClientNavBadgeCounts } from "@/lib/data/client-nav-badges";
import { resolveLocale } from "@/i18n/config";
import { getUserAreaAccess } from "@/lib/auth/area-access.server";
import { requireClientAuth } from "@/lib/auth/session";
import {
  clientAreaHref,
  isPortalHostname,
  readRequestHostname,
} from "@/lib/routing";
import { constructMetadata } from "@/lib/seo/metadata";
import { getPortalBaseUrl } from "@/lib/stripe/app-url";
import { isStripeCheckoutReturnPath } from "@/lib/stripe/checkout-paths";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  const requestHeaders = await headers();
  const hostname = readRequestHostname((name) => requestHeaders.get(name));
  const onPortal = isPortalHostname(hostname);

  return constructMetadata({
    title: t("clientAreaTitle"),
    description: t("clientAreaDescription"),
    path: onPortal ? "/" : "/client",
    noIndex: true,
    siteUrl: onPortal ? getPortalBaseUrl() : undefined,
    includeCanonical: false,
  });
}

export default async function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  logClientRouteBeacon("client/layout.tsx RENDER start");
  const locale = resolveLocale(await getLocale());
  const tClient = await getTranslations("client");
  const tCommon = await getTranslations("common");
  const tNav = await getTranslations("navigation");
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") ?? "";
  const hostname = readRequestHostname((name) => requestHeaders.get(name));

  if (pathname.startsWith("/client/booking")) {
    return <div className="min-h-full bg-[#050816] text-white">{children}</div>;
  }

  if (isStripeCheckoutReturnPath(pathname)) {
    return (
      <div className="min-h-full bg-[#050816] text-white">
        <header className="border-b border-[#1E293B] px-4 py-4 sm:px-6">
          <p className="text-xs uppercase tracking-widest text-[#64748B]">
            {tClient("areaLabel")}
          </p>
          <Link
            href={clientAreaHref("/client/invoices", hostname)}
            className="text-sm font-medium text-white hover:text-violet-200"
          >
            ← {tCommon("backToInvoices")}
          </Link>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
      </div>
    );
  }

  const session = await requireClientAuth();
  const navBadges = await getClientNavBadgeCounts(session);
  const areaAccess = await getUserAreaAccess();

  return (
    <PlatformShell
      profile={session.profile}
      navSections={buildClientNavSections((key) => tNav(key), hostname, navBadges, {
        includeBooking: areaAccess?.hasBookingPortal === true,
      })}
      areaTitle={tClient("areaTitle")}
      areaLabel={tClient("areaLabel")}
      homeHref={clientAreaHref("/client/dashboard", hostname)}
      locale={locale}
    >
      {children}
    </PlatformShell>
  );
}
