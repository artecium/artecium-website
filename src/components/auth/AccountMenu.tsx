"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

interface AccountMenuProps {
  displayName: string;
  email: string;
  workspacesHref: string;
  /** Compact trigger (icon-only on very small screens). */
  variant?: "header" | "standalone";
}

export function AccountMenu({
  displayName,
  email,
  workspacesHref,
  variant = "header",
}: AccountMenuProps) {
  const t = useTranslations("account");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const triggerLabel = displayName.trim() || email;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const triggerClass =
    variant === "header"
      ? "inline-flex max-w-[min(100%,14rem)] items-center gap-2 rounded-full border border-[#1E293B] bg-[#0E1324] px-3 py-2 text-sm font-medium text-white transition-colors hover:border-[#334155] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
      : "inline-flex max-w-[min(100%,14rem)] items-center gap-2 rounded-full border border-[#1E293B] bg-[#0E1324] px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#334155]";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={triggerClass}
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/20 text-xs font-semibold text-[#BFDBFE]"
          aria-hidden="true"
        >
          {triggerLabel.charAt(0).toUpperCase()}
        </span>
        <span className="truncate">{triggerLabel}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-[#64748B] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-[#1E293B] bg-[#0E1324] py-2 shadow-2xl"
        >
          <div className="border-b border-[#1E293B] px-4 pb-3 pt-1">
            <p className="truncate text-sm font-medium text-white">{displayName || email}</p>
            {displayName ? (
              <p className="truncate text-xs text-[#64748B]">{email}</p>
            ) : null}
          </div>
          <Link
            role="menuitem"
            href={workspacesHref}
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-[#94A3B8] transition-colors hover:bg-[#1E293B]/40 hover:text-white"
          >
            {t("workspaces")}
          </Link>
          <button
            type="button"
            role="menuitem"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
            className="block w-full px-4 py-2.5 text-left text-sm text-[#94A3B8] transition-colors hover:bg-[#1E293B]/40 hover:text-white disabled:opacity-60"
          >
            {signingOut ? tCommon("signingOut") : tCommon("signOut")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
