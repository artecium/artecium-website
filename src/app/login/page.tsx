import { ArteciumLogo } from "@/components/ArteciumLogo";
import { LoginForm } from "@/components/auth/LoginForm";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { resolveLocale } from "@/i18n/config";
import { constructMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");

  return constructMetadata({
    title: t("clientLoginTitle"),
    description: t("clientLoginDescription"),
    path: "/login",
    noIndex: true,
  });
}

export default async function LoginPage() {
  const locale = resolveLocale(await getLocale());
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");

  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden bg-[#050816] px-6 py-16 font-sans text-white sm:px-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-[#2563EB]/[0.04] blur-[120px] animate-glow-pulse" />
        <div className="absolute -left-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-[#0D47A1]/[0.06] blur-[100px]" />
        <div className="animate-streak-drift absolute bottom-32 right-0 h-px w-1/2 bg-gradient-to-l from-transparent via-[#2563EB]/40 to-transparent" />
      </div>

      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <LanguageSwitcher currentLocale={locale} />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="group flex flex-col items-center gap-3">
            <ArteciumLogo
              className="h-10 w-10 transition-transform duration-300 group-hover:scale-105 sm:h-11 sm:w-11"
              priority
            />
            <span className="text-sm font-semibold tracking-[0.2em] text-white">
              ARTECIUM
            </span>
          </Link>
        </div>

        <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.3)] sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {t("clientLogin")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#94A3B8] sm:text-base">
              {t("accessClientArea")}
            </p>
          </div>

          <LoginForm />
        </div>

        <p className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#94A3B8] transition-colors duration-200 hover:text-white"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {tCommon("backToHomepage")}
          </Link>
        </p>
      </div>
    </div>
  );
}
