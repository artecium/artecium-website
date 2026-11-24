"use client";

import { ArteciumLogo } from "@/components/ArteciumLogo";
import {
  resolveBookingAreaHubHref,
  resolveClientAreaHubHref,
  type UserAreaAccess,
} from "@/lib/auth/area-access-policy";
import { ClientAreaNavLink } from "@/components/routing/ClientAreaNavLink";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

type AreaHubReason = "clientDenied" | "bookingDenied" | null;

interface AreaHubProps {
  access: UserAreaAccess | null;
  reason: AreaHubReason;
  homeHref: string;
}

export function AreaHub({ access, reason, homeHref }: AreaHubProps) {
  const t = useTranslations("areaHub");
  const [clientHasSession, setClientHasSession] = useState<boolean | null>(null);

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

  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden bg-[#050816] px-6 py-16 font-sans text-white sm:px-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-[#2563EB]/[0.04] blur-[120px] animate-glow-pulse" />
        <div className="absolute -left-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-[#0D47A1]/[0.06] blur-[100px]" />
      </div>

      <div className="relative z-[1] w-full max-w-3xl animate-fade-up">
        <div className="mb-10 flex flex-col items-center text-center">
          <Link href={homeHref} className="group flex flex-col items-center gap-3">
            <ArteciumLogo
              className="h-10 w-10 transition-transform duration-300 group-hover:scale-105 sm:h-11 sm:w-11"
              priority
            />
            <span className="text-sm font-semibold tracking-[0.2em] text-white">
              ARTECIUM
            </span>
          </Link>
          <h1 className="mt-8 text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#94A3B8] sm:text-base">
            {t("description")}
          </p>
        </div>

        {reason === "bookingDenied" ? (
          <p
            role="alert"
            className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100"
          >
            {t("errors.bookingDenied")}
          </p>
        ) : null}

        {access?.isStaff ? (
          <p className="mb-6 text-center text-sm text-[#94A3B8]">
            {t("staffNotice")}{" "}
            <Link href="/admin/dashboard" className="font-medium text-[#2563EB] hover:underline">
              {t("staffLink")}
            </Link>
          </p>
        ) : null}

        {hasSession ? (
          <p className="mb-4 text-center text-xs text-[#64748B]">{t("sessionActiveHint")}</p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <AreaCard
            title={t("client.title")}
            description={t("client.description")}
            href={clientHref}
            cta={hasSession ? t("client.enter") : t("client.signIn")}
            clientPortalLink={clientHref.startsWith("/client/")}
          />
          <AreaCard
            title={t("booking.title")}
            description={t("booking.description")}
            href={bookingHref}
            cta={hasSession ? t("booking.enter") : t("booking.signIn")}
          />
        </div>

        <p className="mt-10 text-center">
          <Link
            href={homeHref}
            className="inline-flex items-center gap-2 text-sm text-[#94A3B8] transition-colors duration-200 hover:text-white"
          >
            {t("backToHome")}
          </Link>
        </p>
      </div>
    </div>
  );
}

const areaCardClassName =
  "group flex h-full flex-col rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.2)] transition-colors hover:border-[#2563EB]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]";

function AreaCard({
  title,
  description,
  href,
  cta,
  clientPortalLink = false,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  clientPortalLink?: boolean;
}) {
  const content = (
    <>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">{description}</p>
      <span className="mt-6 inline-flex h-10 w-fit items-center justify-center rounded-full bg-[#2563EB] px-5 text-sm font-medium text-white transition-all duration-300 group-hover:bg-[#1D4ED8] group-hover:shadow-[0_0_32px_rgba(37,99,235,0.35)]">
        {cta}
      </span>
    </>
  );

  if (clientPortalLink) {
    return (
      <ClientAreaNavLink internalHref={href} className={areaCardClassName}>
        {content}
      </ClientAreaNavLink>
    );
  }

  return (
    <Link href={href} prefetch={false} className={areaCardClassName}>
      {content}
    </Link>
  );
}
