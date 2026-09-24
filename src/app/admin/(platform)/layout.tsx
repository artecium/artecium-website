import { PlatformShell } from "@/components/platform/PlatformShell";
import { filterAdminNavForPermissions } from "@/config/navigation/admin-phase1";
import { requireStaffAuth } from "@/lib/auth/session";
import { constructMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";
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

  return (
    <PlatformShell
      profile={session.profile}
      navItems={navItems}
      areaTitle="Back Office"
      areaLabel="Admin"
      homeHref="/admin/dashboard"
    >
      {children}
    </PlatformShell>
  );
}
