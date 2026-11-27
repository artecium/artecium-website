"use client";

import { ArteciumLogo } from "@/components/ArteciumLogo";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { buildClientNavItems } from "@/config/navigation/platform";
import { DEFAULT_PORTAL_HOSTNAME } from "@/lib/routing";
import { useTranslations } from "next-intl";

export function ClientDashboardPreview() {
  const t = useTranslations("home.clientArea.preview");
  const tNav = useTranslations("navigation");
  const tStatus = useTranslations("status");
  const previewNavItems = buildClientNavItems(
    (key) => tNav(key),
    DEFAULT_PORTAL_HOSTNAME,
  ).slice(0, 10);

  const dashboardCards = [
    {
      title: t("activeProjects"),
      description: t("demoProject"),
      showProgress: true,
      progress: 68,
    },
    {
      title: t("currentPlan"),
      description: t("planSummary"),
    },
    {
      title: t("payments"),
      description: t("latestPayment"),
    },
    {
      title: t("notifications"),
      description: t("latestNotification"),
    },
    {
      title: t("analytics"),
      description: t("analyticsDescription"),
    },
    {
      title: t("seo"),
      description: t("seoDescription"),
    },
  ];

  return (
    <div
      className="pointer-events-none flex h-full w-full min-w-full select-none bg-[#050816] text-white"
      aria-hidden="true"
    >
      <aside className="hidden w-44 shrink-0 flex-col border-r border-[#1E293B] bg-[#050816] sm:flex lg:w-52">
        <div className="flex h-12 items-center gap-2 border-b border-[#1E293B] px-3 lg:h-14 lg:px-4">
          <ArteciumLogo className="h-6 w-6 lg:h-7 lg:w-7" />
          <div className="min-w-0">
            <p className="truncate text-[9px] font-semibold tracking-[0.18em] lg:text-[10px]">
              ARTECIUM
            </p>
            <p className="truncate text-[8px] text-[#64748B] lg:text-[9px]">
              {t("clientAreaLabel")}
            </p>
          </div>
        </div>
        <nav className="flex-1 overflow-hidden px-2 py-3">
          <ul className="space-y-0.5">
            {previewNavItems.map((item) => {
              const active = item.matchHref === "/client/dashboard";
              return (
                <li key={item.href}>
                  <div
                    className={`rounded-md px-2 py-1.5 text-[9px] lg:text-[10px] ${
                      active
                        ? "bg-[#2563EB]/15 text-white"
                        : "text-[#94A3B8]"
                    }`}
                  >
                    {item.label}
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center justify-between border-b border-[#1E293B] bg-[#050816]/90 px-3 lg:h-14 lg:px-4">
          <div>
            <p className="text-[8px] uppercase tracking-widest text-[#64748B] lg:text-[9px]">
              {t("clientPortal")}
            </p>
            <p className="text-[10px] font-medium text-white lg:text-xs">
              {t("demoClient")}
            </p>
          </div>
          <div className="rounded-md border border-[#1E293B] px-2 py-1 text-[8px] text-[#94A3B8] lg:text-[9px]">
            {t("signOut")}
          </div>
        </header>

        <main className="flex-1 overflow-hidden px-3 py-3 lg:px-4 lg:py-4">
          <div className="mb-3 lg:mb-4">
            <h3 className="text-xs font-semibold text-white lg:text-sm">
              {t("welcomeBack")}
            </h3>
            <p className="mt-1 text-[9px] leading-relaxed text-[#94A3B8] lg:text-[10px]">
              {t("overview")}
            </p>
          </div>

          <div className="mb-3 rounded-xl border border-[#1E293B] bg-[#0E1324] p-3 lg:mb-4 lg:p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[9px] font-semibold text-white lg:text-[10px]">
                {t("currentPlan")}
              </p>
              <span className="text-[8px] text-[#2563EB] lg:text-[9px]">
                {t("viewAllServices")}
              </span>
            </div>
            <div className="mt-2 rounded-lg border border-[#1E293B] bg-[#050816]/40 p-2 lg:p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[9px] font-medium text-white lg:text-[10px]">
                  {t("websiteMaintenance")}
                </p>
                <StatusBadge label={tStatus("active")} tone="info" />
              </div>
              <p className="mt-1 text-[8px] text-[#94A3B8] lg:text-[9px]">
                {t("planGrowth")}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#050816]">
                <div className="h-full w-[62%] rounded-full bg-[#2563EB]" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 lg:gap-3">
            {dashboardCards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-[#1E293B] bg-[#0E1324] p-2 lg:p-3"
              >
                <p className="text-[9px] font-medium text-white lg:text-[10px]">
                  {card.title}
                </p>
                <p className="mt-1 text-[8px] leading-relaxed text-[#94A3B8] lg:text-[9px]">
                  {card.description}
                </p>
                {card.showProgress ? (
                  <div className="mt-2 space-y-1">
                    <StatusBadge label={t("inProgress")} tone="info" />
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#050816]">
                      <div
                        className="h-full rounded-full bg-[#2563EB]"
                        style={{ width: `${card.progress}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export function ClientDashboardBrowserFrame() {
  const t = useTranslations("home.clientArea.preview");

  return (
    <div
      role="img"
      aria-label={t("overview")}
      className="flex h-full w-full min-w-full flex-col overflow-hidden rounded-xl bg-[#050816]"
    >
      <div className="flex items-center gap-2 border-b border-[#1E293B] bg-[#0E1324]/80 px-3 py-2.5 sm:px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]/70" />
        <div className="mx-auto flex h-6 w-full max-w-xs items-center rounded-md border border-[#1E293B] bg-[#050816] px-3 text-[10px] text-[#64748B] sm:max-w-sm sm:text-xs">
          client.artecium.com/dashboard
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ClientDashboardPreview />
      </div>
    </div>
  );
}
