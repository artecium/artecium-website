import Link from "next/link";
import type { ReactNode } from "react";

interface ClientDashboardHeaderProps {
  greeting: string;
  subtitle: string;
  companyLine?: string;
  notificationsHref: string;
  unreadNotifications: number;
  notificationsLabel: string;
  notificationsAria: string;
}

export function ClientDashboardHeader({
  greeting,
  subtitle,
  companyLine,
  notificationsHref,
  unreadNotifications,
  notificationsLabel,
  notificationsAria,
}: ClientDashboardHeaderProps) {
  return (
    <header className="mb-8 rounded-2xl border border-[#1E293B] bg-gradient-to-br from-[#0E1324] to-[#050816] p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-[#64748B]">
            {subtitle}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {greeting}
          </h1>
          {companyLine ? (
            <p className="mt-2 text-sm text-[#94A3B8]">{companyLine}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={notificationsHref}
            className="relative inline-flex h-11 items-center gap-2 rounded-full border border-[#1E293B] bg-[#050816]/60 px-4 text-sm font-medium text-[#E2E8F0] transition-colors hover:border-[#2563EB]/40 hover:bg-[#0E1324] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            aria-label={notificationsAria}
          >
            <BellIcon />
            <span className="hidden sm:inline">{notificationsLabel}</span>
            {unreadNotifications > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2563EB] px-1.5 text-[11px] font-semibold text-white">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}

function BellIcon(): ReactNode {
  return (
    <svg
      className="h-5 w-5 text-[#94A3B8]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}
