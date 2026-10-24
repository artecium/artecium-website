"use client";

import { ArteciumLogo } from "@/components/ArteciumLogo";
import { StartProjectButton } from "@/components/contact/StartProjectButton";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { resolveLocale } from "@/i18n/config";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

function isHomepage(pathname: string): boolean {
  return pathname === "/" || pathname === "/en";
}

function hasLocalPricing(pathname: string): boolean {
  return (
    /^\/servicos\/(websites|ia|seo)$/.test(pathname) ||
    /^\/en\/servicos\/(websites|ia|seo)$/.test(pathname)
  );
}

function resolvePricingHref(pathname: string, homePath: string): string {
  if (isHomepage(pathname)) {
    return "#pricing";
  }

  if (hasLocalPricing(pathname)) {
    return "#pricing";
  }

  return `${homePath}#pricing`;
}

export function Navbar() {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const currentLocale = resolveLocale(useLocale());
  const homePath = currentLocale === "en" ? "/en" : "/";
  const servicesHref =
    currentLocale === "en" ? "/en/servicos" : "/servicos";
  const projectsHref =
    currentLocale === "en" ? "/en/projetos" : "/projetos";
  const faqHref = currentLocale === "en" ? "/en/faq" : "/faq";
  const pricingHref = resolvePricingHref(pathname, homePath);

  const navLinkClass =
    "text-sm text-[#94A3B8] transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50";
  const mobileLinkClass =
    "block rounded-lg px-3 py-2 text-sm text-[#94A3B8] transition-colors hover:bg-[#1E293B]/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50";

  const navItems = [
    { href: servicesHref, label: t("services"), isAnchor: false },
    { href: pricingHref, label: t("pricing"), isAnchor: pricingHref.startsWith("#") },
    { href: projectsHref, label: t("projects"), isAnchor: false },
    { href: faqHref, label: t("faq"), isAnchor: false },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-[#1E293B]/60 bg-[#050816]/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-16">
        <Link href={homePath} className="group flex items-center gap-3">
          <ArteciumLogo
            className="h-9 w-9 transition-transform duration-300 group-hover:scale-105 sm:h-10 sm:w-10"
            priority
          />
          <span className="text-sm font-semibold tracking-[0.2em] text-white sm:text-[0.9375rem]">
            ARTECIUM
          </span>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) =>
            item.isAnchor ? (
              <a key={item.label} href={item.href} className={navLinkClass}>
                {item.label}
              </a>
            ) : (
              <Link key={item.label} href={item.href} className={navLinkClass}>
                {item.label}
              </Link>
            ),
          )}
          <StartProjectButton className="h-10 px-5 text-sm">
            {t("requestQuote")}
          </StartProjectButton>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher
            currentLocale={currentLocale}
            className="hidden sm:inline-flex"
          />

          <Link
            href="/login"
            className="hidden rounded-full border border-[#1E293B] px-4 py-2 text-sm font-medium text-[#94A3B8] transition-all duration-300 hover:border-[#334155] hover:text-white lg:inline-flex"
          >
            {t("clientLogin")}
          </Link>

          <StartProjectButton className="h-10 px-4 text-sm lg:hidden">
            {t("requestQuote")}
          </StartProjectButton>

          <details className="relative lg:hidden">
            <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg border border-[#1E293B] bg-[#0E1324] text-[#94A3B8] transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </summary>
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-[#1E293B] bg-[#0E1324] p-2 shadow-2xl">
              {navItems.map((item) =>
                item.isAnchor ? (
                  <a key={item.label} href={item.href} className={mobileLinkClass}>
                    {item.label}
                  </a>
                ) : (
                  <Link key={item.label} href={item.href} className={mobileLinkClass}>
                    {item.label}
                  </Link>
                ),
              )}
              <div className="mt-2 px-1">
                <LanguageSwitcher currentLocale={currentLocale} />
              </div>
              <Link
                href="/login"
                className="mt-1 block rounded-lg px-3 py-2 text-center text-sm font-medium text-[#94A3B8] transition-colors hover:bg-[#1E293B]/40 hover:text-white"
              >
                {t("clientLogin")}
              </Link>
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
