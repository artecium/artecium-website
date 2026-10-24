import { PlatformHeader } from "@/components/platform/PlatformHeader";
import { PlatformSidebar } from "@/components/platform/PlatformSidebar";
import type { NavItem } from "@/config/navigation/platform";
import type { AppLocale } from "@/i18n/config";
import type { PlatformProfile } from "@/types/platform";
import type { ReactNode } from "react";

interface PlatformShellProps {
  children: ReactNode;
  profile: PlatformProfile;
  navItems: NavItem[];
  areaTitle: string;
  areaLabel: string;
  homeHref: string;
  locale: AppLocale;
}

export function PlatformShell({
  children,
  profile,
  navItems,
  areaTitle,
  areaLabel,
  homeHref,
  locale,
}: PlatformShellProps) {
  return (
    <div className="flex min-h-full bg-[#050816] text-white">
      <PlatformSidebar items={navItems} title={areaTitle} homeHref={homeHref} />
      <div className="flex min-h-full flex-1 flex-col">
        <PlatformHeader
          profile={profile}
          areaLabel={areaLabel}
          locale={locale}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
