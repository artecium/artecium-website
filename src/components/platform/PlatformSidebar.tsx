"use client";

import { ArteciumLogo } from "@/components/ArteciumLogo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { NavItem } from "@/config/navigation/platform";

interface PlatformSidebarProps {
  items: NavItem[];
  title: string;
  homeHref: string;
}

export function PlatformSidebar({
  items,
  title,
  homeHref,
}: PlatformSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg lg:hidden"
        aria-label="Open navigation"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close navigation overlay"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#1E293B] bg-[#050816] transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-[#1E293B] px-5">
          <Link href={homeHref} className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <ArteciumLogo className="h-8 w-8" />
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-white">ARTECIUM</p>
              <p className="text-[11px] text-[#64748B]">{title}</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-[#2563EB]/15 text-white"
                        : "text-[#94A3B8] hover:bg-[#0E1324] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
