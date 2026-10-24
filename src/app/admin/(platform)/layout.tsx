import { PlatformShell } from "@/components/platform/PlatformShell";
import { filterAdminNavForPermissions } from "@/config/navigation/admin-phase1";
import { resolveLocale } from "@/i18n/config";
import { requireStaffAuth } from "@/lib/auth/session";
import { constructMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";

export const metadata: Metadata = constructMetadata({
  title: "Admin",
  description: "Artecium back office.",
  path: "/admin",
  noIndex: true,
});

export default async function AdminPlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireStaffAuth();
  const navItems = filterAdminNavForPermissions(session.profile.permissions);
  const locale = resolveLocale(await getLocale());

  return (
    <PlatformShell
      profile={session.profile}
      navItems={navItems}
      areaTitle="Back Office"
      areaLabel="Admin"
      homeHref="/admin/dashboard"
      locale={locale}
    >
      {children}
    </PlatformShell>
  );
}
