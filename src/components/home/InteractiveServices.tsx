"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  RadialOrbitalServices,
  type OrbitServiceNode,
} from "@/components/ui/radial-orbital-services";
import { resolveLocale, type AppLocale } from "@/i18n/config";
import {
  getServicePath,
  getServicesHubPath,
  type ServicePageId,
} from "@/lib/services/paths";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Clockwise from top: Websites, SEO, Automação, Aplicações Web, IA */
const ORBIT_SERVICE_IDS = [
  "websites",
  "seo",
  "automation",
  "webApps",
  "ai",
] as const;

type ServiceId = (typeof ORBIT_SERVICE_IDS)[number];

interface OrbitDimensions {
  container: number;
  radius: number;
  center: number;
  cardWidth: number;
  cardHeight: number;
}

const ORBIT_BREAKPOINTS = {
  mobile: {
    container: 360,
    radius: 158,
    center: 136,
    cardWidth: 112,
    cardHeight: 96,
  },
  tablet: {
    container: 560,
    radius: 196,
    center: 196,
    cardWidth: 168,
    cardHeight: 122,
  },
  desktop: {
    container: 680,
    radius: 248,
    center: 216,
    cardWidth: 188,
    cardHeight: 128,
  },
} as const;

function useOrbitDimensions(): OrbitDimensions {
  const [dims, setDims] = useState<OrbitDimensions>(ORBIT_BREAKPOINTS.desktop);

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDims(ORBIT_BREAKPOINTS.mobile);
      } else if (width < 1024) {
        setDims(ORBIT_BREAKPOINTS.tablet);
      } else {
        setDims(ORBIT_BREAKPOINTS.desktop);
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return dims;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

const serviceIcons: Record<ServiceId, ReactNode> = {
  websites: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  ),
  ai: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  ),
  automation: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.5 15.3l-1.57-1.57a2.25 2.25 0 00-1.59-.659H9.75m9.75 0v2.25a2.25 2.25 0 01-2.25 2.25H5.25a2.25 2.25 0 01-2.25-2.25V15.3" />
    </svg>
  ),
  seo: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
    </svg>
  ),
  webApps: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  ),
};

function getServiceHref(id: ServiceId, locale: AppLocale): string {
  switch (id) {
    case "websites":
      return getServicePath("websites" satisfies ServicePageId, locale);
    case "ai":
    case "automation":
      return getServicePath("ia", locale);
    case "seo":
      return getServicePath("seo", locale);
    case "webApps":
      return getServicesHubPath(locale);
  }
}

export function InteractiveServices() {
  const t = useTranslations("home.interactiveServices");
  const locale = resolveLocale(useLocale());
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const prefersReducedMotion = usePrefersReducedMotion();
  const dims = useOrbitDimensions();
  const sectionId = useId();
  const [activeId, setActiveId] = useState<ServiceId | null>(null);

  const nodes = useMemo<OrbitServiceNode[]>(
    () =>
      ORBIT_SERVICE_IDS.map((id) => ({
        id,
        name: t(`services.${id}.name`),
        centerTitle: t(`services.${id}.centerTitle`),
        headline: t(`services.${id}.headline`),
        tags: t(`services.${id}.tags`),
        shortDescription: t(`services.${id}.shortDescription`),
        ariaLabel: t(`services.${id}.ariaLabel`),
        href: getServiceHref(id, locale),
        icon: serviceIcons[id],
      })),
    [t, locale],
  );

  const enableRotation = !prefersReducedMotion;

  const handleNavigate = useCallback(
    (id: string, href: string) => {
      if (isDesktop || activeId === id) {
        router.push(href);
        return;
      }
      setActiveId(id as ServiceId);
    },
    [activeId, isDesktop, router],
  );

  return (
    <section
      id="interactive-services"
      aria-labelledby={`${sectionId}-heading`}
      className="overflow-x-hidden border-t border-[#1E293B]/60 bg-[#050816] px-6 py-24 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title={t("title")}
          description={t("description")}
          titleId={`${sectionId}-heading`}
        />

        <div className="mt-16 flex flex-col items-center gap-8">
          <RadialOrbitalServices
            nodes={nodes}
            containerSize={dims.container}
            radius={dims.radius}
            centerSize={dims.center}
            cardWidth={dims.cardWidth}
            cardHeight={dims.cardHeight}
            enableRotation={enableRotation}
            activeId={activeId}
            onActivate={(id) => setActiveId(id as ServiceId)}
            onDeactivate={() => setActiveId(null)}
            onNavigate={handleNavigate}
            isDesktop={isDesktop}
            logoAlt={t("logoAlt")}
            defaultTitle={t("defaultTitle")}
            viewServiceLabel={t("viewService")}
          />

          {!isDesktop && activeId && (
            <p className="max-w-sm text-center text-xs text-[#64748B]">
              {t("mobileHint")}
            </p>
          )}
        </div>

        <nav aria-label={t("navLabel")} className="sr-only">
          <ul>
            {nodes.map((node) => (
              <li key={node.id}>
                <Link href={node.href}>
                  {node.name} — {node.headline}. {node.tags}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
