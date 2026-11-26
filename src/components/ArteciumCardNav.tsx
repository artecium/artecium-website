// @ts-nocheck — CardNav is official JS registry component.
"use client";

import CardNav from "@/components/card-nav/CardNav";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { resolveLocale } from "@/i18n/config";
import { PUBLIC_AUTH_ENTRY_PATH } from "@/lib/auth/entry-routes";
import { getBookingMarketingPath } from "@/lib/product-landing/paths";
import { useWizard } from "@/hooks/useWizardContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import "@/components/card-nav/artecium-card-nav.css";

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
  if (isHomepage(pathname)) return "#pricing";
  if (hasLocalPricing(pathname)) return "#pricing";
  return `${homePath}#pricing`;
}

function resolveHashHref(pathname: string, homePath: string, hash: string): string {
  if (isHomepage(pathname)) return hash;
  return `${homePath}${hash}`;
}

export function ArteciumCardNav() {
  const t = useTranslations("navigation");
  const tCard = useTranslations("cardNav");
  const pathname = usePathname();
  const locale = resolveLocale(useLocale());
  const { open: openWizard } = useWizard();
  const [menuOpen, setMenuOpen] = useState(false);

  const homePath = locale === "en" ? "/en" : "/";
  const servicesHref = locale === "en" ? "/en/servicos" : "/servicos";
  const projectsHref = locale === "en" ? "/en/projetos" : "/projetos";
  const faqHref = locale === "en" ? "/en/faq" : "/faq";
  const pricingHref = resolvePricingHref(pathname, homePath);
  const platformsHref = resolveHashHref(pathname, homePath, "#platforms");
  const bookingHref = getBookingMarketingPath(locale);
  const clientHref = PUBLIC_AUTH_ENTRY_PATH;

  const items = useMemo(
    () => [
      {
        label: tCard("explore.title"),
        description: tCard("explore.description"),
        links: [
          { label: t("services"), href: servicesHref },
          { label: t("pricing"), href: pricingHref },
          { label: t("projects"), href: projectsHref },
        ],
      },
      {
        label: tCard("info.title"),
        description: tCard("info.description"),
        links: [
          { label: t("faq"), href: faqHref },
          { label: tCard("platforms"), href: platformsHref },
          { label: "Booking", href: bookingHref },
        ],
      },
      {
        label: tCard("client.title"),
        description: tCard("client.description"),
        links: [{ label: t("clientLogin"), href: clientHref }],
      },
    ],
    [
      bookingHref,
      clientHref,
      faqHref,
      platformsHref,
      pricingHref,
      projectsHref,
      servicesHref,
      t,
      tCard,
    ],
  );

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const logo = (
    <span className="inline-flex items-center gap-2.5">
      <Image
        src="/artecium-logo.png"
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 object-contain"
        priority
      />
      <span className="text-[0.8125rem] font-semibold tracking-[0.18em] text-white sm:text-sm sm:tracking-[0.2em]">
        ARTECIUM
      </span>
    </span>
  );

  return (
    <div className="artecium-card-nav-shell" data-menu-open={menuOpen ? "" : undefined}>
        <CardNav
          className="artecium-card-nav"
          ariaLabel={tCard("ariaMain")}
          logo={logo}
          logoHref={homePath}
          logoAlt="Artecium"
          linkComponent={Link}
          items={items}
          theme="dark"
          surface="glass"
          openOn="click"
          cardEffect="rise"
          accentColor="#2563EB"
          maxWidth={1160}
          cardHeight={168}
          speed={1.15}
          bounce={0.12}
          stagger={0.1}
          intro={false}
          menuOpenLabel={tCard("menuOpen")}
          menuCloseLabel={tCard("menuClose")}
          open={menuOpen}
          onOpenChange={setMenuOpen}
          cta={{
            label: t("requestQuote"),
            onClick: () => {
              openWizard();
              closeMenu();
            },
          }}
          style={{
            "--cn-bar": "68px",
            "--cn-radius": "20px",
            "--cn-logo": "32px",
            "--cn-panel": "rgba(5, 8, 22, 0.82)",
            "--cn-solid": "#050816",
            "--cn-edge": "rgba(30, 41, 59, 0.85)",
            "--cn-highlight": "rgba(255, 255, 255, 0.06)",
            "--cn-shadow":
              "0 20px 50px -18px rgba(0, 0, 0, 0.75), 0 8px 24px -12px rgba(0, 0, 0, 0.45)",
            "--cn-text": "#ffffff",
            "--cn-muted": "rgba(148, 163, 184, 0.95)",
            "--cn-hover": "rgba(37, 99, 235, 0.08)",
            "--cn-ring": "rgba(37, 99, 235, 0.55)",
            "--cn-tile":
              "linear-gradient(180deg, rgba(14, 19, 36, 0.98) 0%, rgba(5, 8, 22, 0.98) 100%)",
            "--cn-tile-rim":
              "inset 0 0 0 1px rgba(30, 41, 59, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            "--cn-cta-hover": "brightness(1.06)",
          }}
          footer={
            <div className="artecium-card-nav__locale">
              <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[#64748B] uppercase">
                {tCard("language")}
              </p>
              <LanguageSwitcher
                currentLocale={locale}
                className="w-full justify-center sm:w-auto"
                onLocaleChange={closeMenu}
              />
            </div>
          }
        />
    </div>
  );
}