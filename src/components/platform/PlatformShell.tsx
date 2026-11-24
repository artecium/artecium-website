import { PlatformHeader } from "@/components/platform/PlatformHeader";
import { PlatformSidebar } from "@/components/platform/PlatformSidebar";
import type { ClientNavEntry, NavItem } from "@/config/navigation/platform";
import type { AppLocale } from "@/i18n/config";
import type { PlatformProfile } from "@/types/platform";
import type { ReactNode } from "react";

interface PlatformShellProps {
  children: ReactNode;
  profile: PlatformProfile;
  /** Flat navigation (Back Office, Booking). */
  navItems?: NavItem[];
  /** Grouped navigation (Client area). */
  navSections?: ClientNavEntry[];
  areaTitle: string;
  areaLabel: string;
  homeHref: string;
  locale: AppLocale;
  navPathMatch?: "booking" | "client";
}

export function PlatformShell({
  children,
  profile,
  navItems,
  navSections,
  areaTitle,
  areaLabel,
  homeHref,
  locale,
  navPathMatch,
}: PlatformShellProps) {
  return (
    <div className="flex min-h-full bg-[#050816] text-white">
      <PlatformSidebar
        items={navItems}
        sections={navSections}
        title={areaTitle}
        homeHref={homeHref}
        navPathMatch={navPathMatch}
      />
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
