"use client";

import { ArteciumLogo } from "@/components/ArteciumLogo";
import { ClientNavIcon } from "@/components/platform/client-nav-icons";
import type { ClientNavEntry, NavItem } from "@/config/navigation/platform";
import { bookingAdminPathnameForNavMatch, clientAreaPathnameForNavMatch } from "@/lib/routing";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useCallback, useId, useState } from "react";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]";

const linkClass = (active: boolean) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ${focusRing} ${
    active
      ? "bg-[#2563EB]/15 text-white shadow-sm shadow-[#2563EB]/10"
      : "text-[#94A3B8] hover:bg-[#0E1324] hover:text-white"
  }`;

const subLinkClass = (active: boolean) =>
  `flex items-center gap-2.5 rounded-lg py-2 pl-2 pr-2 text-sm transition-colors duration-150 ${focusRing} ${
    active
      ? "bg-[#2563EB]/15 text-white"
      : "text-[#94A3B8] hover:bg-[#0E1324] hover:text-white"
  }`;

function isNavItemActive(pathnameForMatch: string, item: NavItem): boolean {
  const matchBase = item.matchHref ?? item.href;
  return (
    pathnameForMatch === matchBase ||
    pathnameForMatch.startsWith(`${matchBase}/`)
  );
}

function NavBadge({ count }: { count: number }) {
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2563EB]/20 px-1.5 text-[11px] font-semibold tabular-nums text-[#93C5FD]">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavItemContent({
  item,
  active,
  nested,
}: {
  item: NavItem;
  active: boolean;
  nested?: boolean;
}) {
  const iconId = item.iconId;
  return (
    <>
      {iconId ? (
        <span
          className={
            active ? "text-[#60A5FA]" : "text-[#64748B]"
          }
        >
          <ClientNavIcon id={iconId} />
        </span>
      ) : null}
      <span className={`min-w-0 flex-1 truncate ${nested ? "" : "font-medium"}`}>
        {item.label}
      </span>
      {item.badge !== undefined && item.badge > 0 ? (
        <NavBadge count={item.badge} />
      ) : null}
    </>
  );
}

interface PlatformSidebarProps {
  title: string;
  homeHref: string;
  /** Flat list (Back Office, Booking). */
  items?: NavItem[];
  /** Grouped client area navigation. */
  sections?: ClientNavEntry[];
  /** How to normalize `usePathname()` for active nav state (no function props from Server Components). */
  navPathMatch?: "booking" | "client";
}

export function PlatformSidebar({
  items,
  sections,
  title,
  homeHref,
  navPathMatch,
}: PlatformSidebarProps) {
  "use no memo";

  const t = useTranslations("common");
  const pathname = usePathname();
  const pathnameForMatch =
    navPathMatch === "booking"
      ? bookingAdminPathnameForNavMatch(pathname)
      : navPathMatch === "client"
        ? clientAreaPathnameForNavMatch(pathname)
        : clientAreaPathnameForNavMatch(pathname);
  const navLabelId = useId();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(
    {},
  );

  const isItemActive = useCallback(
    (item: NavItem) => isNavItemActive(pathnameForMatch, item),
    [pathnameForMatch],
  );

  const isGroupActive = useCallback(
    (groupItems: NavItem[]) => groupItems.some((item) => isItemActive(item)),
    [isItemActive],
  );

  const isGroupExpanded = useCallback(
    (groupId: string, groupItems: NavItem[]) => {
      if (isGroupActive(groupItems)) return true;
      return collapsedGroups[groupId] !== true;
    },
    [collapsedGroups, isGroupActive],
  );

  const toggleGroup = (groupId: string, groupItems: NavItem[]) => {
    if (isGroupActive(groupItems)) return;
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: prev[groupId] !== true,
    }));
  };

  const closeMobile = () => setMobileOpen(false);

  const renderClientSections = () => (
    <ul className="space-y-0.5">
      {sections!.map((entry) => {
        if (entry.kind === "link") {
          const active = isItemActive(entry.item);
          return (
            <li key={entry.item.href}>
              <Link
                href={entry.item.href}
                onClick={closeMobile}
                className={linkClass(active)}
                aria-current={active ? "page" : undefined}
              >
                <NavItemContent item={entry.item} active={active} />
              </Link>
            </li>
          );
        }

        const expanded = isGroupExpanded(entry.id, entry.items);
        const groupActive = isGroupActive(entry.items);
        const groupPanelId = `nav-group-${entry.id}`;

        return (
          <li key={entry.id} className="pt-1">
            <button
              type="button"
              onClick={() => toggleGroup(entry.id, entry.items)}
              aria-expanded={expanded}
              aria-controls={groupPanelId}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-150 ${focusRing} ${
                groupActive
                  ? "text-white"
                  : "text-[#94A3B8] hover:bg-[#0E1324] hover:text-white"
              }`}
            >
              <span className={groupActive ? "text-[#60A5FA]" : "text-[#64748B]"}>
                <ClientNavIcon id={entry.groupIconId} />
              </span>
              <span className="min-w-0 flex-1 font-medium">{entry.title}</span>
              <svg
                className={`h-4 w-4 shrink-0 text-[#64748B] transition-transform duration-200 motion-reduce:transition-none ${
                  expanded ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <div
              id={groupPanelId}
              className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
                expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <ul
                  className="mt-0.5 space-y-0.5 border-l border-[#1E293B] pl-2 ml-4 pb-0.5"
                  role="group"
                  aria-label={entry.title}
                >
                  {entry.items.map((item) => {
                    const active = isItemActive(item);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={closeMobile}
                          className={subLinkClass(active)}
                          aria-current={active ? "page" : undefined}
                        >
                          <NavItemContent item={item} active={active} nested />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );

  const renderFlatItems = () => (
    <ul className="space-y-1">
      {(items ?? []).map((item) => {
        const active = isItemActive(item);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={closeMobile}
              className={linkClass(active)}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className={`fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg lg:hidden ${focusRing}`}
        aria-label={t("openNavigation")}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={closeMobile}
          aria-label={t("closeNavigationOverlay")}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#1E293B] bg-[#050816] transition-transform duration-200 ease-out motion-reduce:transition-none lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-[#1E293B] px-5">
          <Link
            href={homeHref}
            className={`flex items-center gap-2.5 ${focusRing} rounded-lg`}
            onClick={closeMobile}
          >
            <ArteciumLogo className="h-8 w-8" />
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-white">ARTECIUM</p>
              <p className="text-[11px] text-[#64748B]">{title}</p>
            </div>
          </Link>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-3 py-4"
          aria-labelledby={navLabelId}
        >
          <p id={navLabelId} className="sr-only">
            {title}
          </p>
          {sections?.length ? renderClientSections() : renderFlatItems()}
        </nav>
      </aside>
    </>
  );
}
