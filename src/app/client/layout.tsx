import { PlatformShell } from "@/components/platform/PlatformShell";
import { clientNavItems } from "@/config/navigation/platform";
import { requireClientAuth } from "@/lib/auth/session";
import { isStripeCheckoutReturnPath } from "@/lib/stripe/checkout-paths";
import { constructMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = constructMetadata({
  title: "Client Area",
  description: "Your Artecium client area.",
  path: "/client",
  noIndex: true,
});

export default async function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") ?? "";

  if (isStripeCheckoutReturnPath(pathname)) {
    return (
      <div className="min-h-full bg-[#050816] text-white">
        <header className="border-b border-[#1E293B] px-4 py-4 sm:px-6">
          <p className="text-xs uppercase tracking-widest text-[#64748B]">Client Portal</p>
          <Link
            href="/client/invoices"
            className="text-sm font-medium text-white hover:text-violet-200"
          >
            ← Voltar às faturas
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
      navItems={clientNavItems}
      areaTitle="Client Area"
      areaLabel="Client Portal"
      homeHref="/client/dashboard"
    >
      {children}
    </PlatformShell>
  );
}
