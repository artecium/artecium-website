import { PlatformShell } from "@/components/platform/PlatformShell";
import { buildClientNavItems } from "@/config/navigation/platform";
import { resolveLocale } from "@/i18n/config";
import { requireClientAuth } from "@/lib/auth/session";
import { constructMetadata } from "@/lib/seo/metadata";
import { isStripeCheckoutReturnPath } from "@/lib/stripe/checkout-paths";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");

  return constructMetadata({
    title: t("clientAreaTitle"),
    description: t("clientAreaDescription"),
    path: "/client",
    noIndex: true,
  });
}

export default async function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = resolveLocale(await getLocale());
  const tClient = await getTranslations("client");
  const tCommon = await getTranslations("common");
  const tNav = await getTranslations("navigation");
  const pathname = (await headers()).get("x-pathname") ?? "";

  if (isStripeCheckoutReturnPath(pathname)) {
    return (
      <div className="min-h-full bg-[#050816] text-white">
        <header className="border-b border-[#1E293B] px-4 py-4 sm:px-6">
          <p className="text-xs uppercase tracking-widest text-[#64748B]">
            {tClient("areaLabel")}
          </p>
          <Link
            href="/client/invoices"
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

  return (
    <PlatformShell
      profile={session.profile}
      navItems={buildClientNavItems((key) => tNav(key))}
      areaTitle={tClient("areaTitle")}
      areaLabel={tClient("areaLabel")}
      homeHref="/client/dashboard"
      locale={locale}
    >
      {children}
    </PlatformShell>
  );
}
