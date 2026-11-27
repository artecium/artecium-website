"use client";

import { AreaHubPlatformsGrid } from "@/components/auth/AreaHubPlatformsGrid";
import type { AreaHubCardId } from "@/components/auth/AreaHubPlatformCard";
import { ArteciumLogo } from "@/components/ArteciumLogo";
import { BookingDashboardBrowserFrame } from "@/components/home/booking-dashboard-preview";
import { ClientDashboardBrowserFrame } from "@/components/home/client-dashboard-preview";
import {
  resolveBookingAreaHubHref,
  resolveClientAreaHubHref,
  type UserAreaAccess,
} from "@/lib/auth/area-access-policy";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useReveal } from "@/hooks/useReveal";

type AreaHubReason = "clientDenied" | "bookingDenied" | null;

interface AreaHubProps {
  access: UserAreaAccess | null;
  reason: AreaHubReason;
  homeHref: string;
  /** First name or display name for welcome line (no auth change). */
  displayName?: string | null;
  /** Dev/QA only — pre-open platform overlay. */
  initialOpenId?: AreaHubCardId | null;
}

export function AreaHub({
  access,
  reason,
  homeHref,
  displayName,
  initialOpenId = null,
}: AreaHubProps) {
  const t = useTranslations("areaHub");
  const [clientHasSession, setClientHasSession] = useState<boolean | null>(null);
  const headerReveal = useReveal();

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => {
      setClientHasSession(Boolean(data.session));
    });
  }, []);

  const hasSession = access !== null || clientHasSession === true;

  const clientHref = useMemo(
    () => resolveClientAreaHubHref(access, hasSession),
    [access, hasSession],
  );

  const bookingHref = useMemo(
    () => resolveBookingAreaHubHref(access, hasSession),
    [access, hasSession],
  );

  const welcomeLine = useMemo(() => {
    const trimmed = displayName?.trim();
    if (!trimmed) return t("greeting");
    const first = trimmed.split(/\s+/)[0];
    return t("greetingWithName", { name: first });
  }, [displayName, t]);

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-[#050816] px-5 py-12 font-sans text-white sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-[20%] top-[10%] h-[min(560px,70vw)] w-[min(560px,70vw)] rounded-full bg-[#2563EB]/[0.055] blur-[120px] animate-glow-pulse" />
        <div className="absolute -left-[15%] bottom-[-10%] h-[min(480px,60vw)] w-[min(480px,60vw)] rounded-full bg-[#0D47A1]/[0.07] blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent)",
          }}
        />
      </div>

      <div className="relative z-[1] mx-auto flex w-full max-w-6xl flex-1 flex-col">
        <header
          ref={headerReveal.ref}
          style={headerReveal.transitionStyle}
          className={`${headerReveal.revealClass} flex flex-col items-center text-center`}
        >
          <Link
            href={homeHref}
            className="group flex flex-col items-center gap-3 transition-opacity hover:opacity-90"
          >
            <ArteciumLogo
              className="h-10 w-10 transition-transform duration-300 group-hover:scale-[1.04] sm:h-11 sm:w-11"
              priority
            />
            <span className="text-xs font-semibold tracking-[0.22em] text-white/90 sm:text-sm">
              ARTECIUM
            </span>
          </Link>

          <p className="mt-8 text-sm font-medium tracking-wide text-[#64748B]">{welcomeLine}</p>

          <h1 className="mt-3 max-w-2xl text-[1.75rem] font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.5rem]">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#94A3B8] sm:text-base">
            {t("description")}
          </p>
        </header>

        {reason === "bookingDenied" ? (
          <p
            role="alert"
            className="mx-auto mt-8 w-full max-w-2xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100"
          >
            {t("errors.bookingDenied")}
          </p>
        ) : null}

        {reason === "clientDenied" ? (
          <p
            role="alert"
            className="mx-auto mt-8 w-full max-w-2xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100"
          >
            {t("errors.clientDenied")}
          </p>
        ) : null}

        {access?.isStaff ? (
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-[#94A3B8]">
            {t("staffNotice")}{" "}
            <Link href="/admin/dashboard" className="font-medium text-[#93C5FD] hover:text-white">
              {t("staffLink")}
            </Link>
          </p>
        ) : null}

        {hasSession ? (
          <p className="mx-auto mt-4 max-w-2xl text-center text-xs leading-relaxed text-[#64748B]">
            {t("sessionActiveHint")}
          </p>
        ) : null}

        <h2 className="sr-only">{t("platformsSrOnly")}</h2>

        <AreaHubPlatformsGrid
          initialOpenId={initialOpenId}
          platforms={[
            {
              cardId: "client",
              href: clientHref,
              platformLabel: t("client.platformLabel"),
              title: t("client.title"),
              description: t("client.description"),
              cta: hasSession ? t("client.enter") : t("client.signIn"),
              visual: <ClientDashboardBrowserFrame />,
              accent: "client",
              cascadeDelayMs: 100,
              clientPortalLink: clientHref.startsWith("/client/"),
            },
            {
              cardId: "booking",
              href: bookingHref,
              platformLabel: t("booking.platformLabel"),
              title: t("booking.title"),
              description: t("booking.description"),
              cta: hasSession ? t("booking.enter") : t("booking.signIn"),
              visual: <BookingDashboardBrowserFrame />,
              accent: "booking",
              cascadeDelayMs: 200,
            },
          ]}
        />

        <p className="mt-10 pb-2 text-center sm:mt-12">
          <Link
            href={homeHref}
            className="inline-flex items-center gap-2 text-sm text-[#64748B] transition-colors duration-200 hover:text-[#CBD5E1]"
          >
            {t("backToHome")}
          </Link>
        </p>
      </div>
    </div>
  );
}