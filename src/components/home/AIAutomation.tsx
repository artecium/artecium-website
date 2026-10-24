"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { resolveLocale } from "@/i18n/config";
import { getServicePath } from "@/lib/services/paths";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
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

const MODULE_IDS = [
  "assistants",
  "chatbots",
  "aiAgents",
  "automation",
  "leadQualification",
  "documentProcessing",
  "dataAnalysis",
  "integrations",
] as const;

type ModuleId = (typeof MODULE_IDS)[number];

interface HubDimensions {
  container: number;
  radius: number;
  center: number;
  moduleWidth: number;
}

const HUB_BREAKPOINTS = {
  mobile: { container: 0, radius: 0, center: 168, moduleWidth: 0 },
  tablet: { container: 580, radius: 210, center: 188, moduleWidth: 132 },
  desktop: { container: 720, radius: 268, center: 204, moduleWidth: 148 },
} as const;

function useHubDimensions(): HubDimensions & { isMobile: boolean } {
  const [dims, setDims] = useState<
    HubDimensions & { isMobile: boolean }
  >({
    ...HUB_BREAKPOINTS.desktop,
    isMobile: false,
  });

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDims({ ...HUB_BREAKPOINTS.mobile, isMobile: true });
      } else if (width < 1024) {
        setDims({ ...HUB_BREAKPOINTS.tablet, isMobile: false });
      } else {
        setDims({ ...HUB_BREAKPOINTS.desktop, isMobile: false });
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

function getModulePosition(
  index: number,
  total: number,
  radius: number,
  containerSize: number,
) {
  const angleDeg = -90 + (index / total) * 360;
  const radian = (angleDeg * Math.PI) / 180;
  const cx = containerSize / 2;

  return {
    x: cx + radius * Math.cos(radian),
    y: cx + radius * Math.sin(radian),
    angleDeg,
  };
}

const moduleIcons: Record<ModuleId, ReactNode> = {
  assistants: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  ),
  chatbots: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.375c0-2.278-3.066-4.125-6.75-4.125S4.5 4.097 4.5 6.375v10.125c0 2.278 3.066 4.125 6.75 4.125s6.75-1.847 6.75-4.125V8.511m-9 3.375h.008v.008H12v-.008z" />
    </svg>
  ),
  leadQualification: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  automation: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.5 15.3l-1.57-1.57a2.25 2.25 0 00-1.59-.659H9.75m9.75 0v2.25a2.25 2.25 0 01-2.25 2.25H5.25a2.25 2.25 0 01-2.25-2.25V15.3" />
    </svg>
  ),
  integrations: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  ),
  documentProcessing: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  aiAgents: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  ),
  dataAnalysis: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
};

interface ModuleCopy {
  id: ModuleId;
  name: string;
  centerTitle: string;
  description: string;
  ariaLabel: string;
}

interface AIHubCenterProps {
  size: number;
  activeModule: ModuleCopy | null;
  logoAlt: string;
  defaultLabel: string;
  defaultSubtitle: string;
  cta: string;
  href: string;
  enablePulse: boolean;
}

function AIHubCenter({
  size,
  activeModule,
  logoAlt,
  defaultLabel,
  defaultSubtitle,
  cta,
  href,
  enablePulse,
}: AIHubCenterProps) {
  const contentKey = activeModule?.id ?? "default";

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size }}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`absolute inset-0 rounded-full bg-[#2563EB]/[0.04] blur-2xl motion-reduce:hidden ${
          enablePulse ? "motion-safe:animate-ai-hub-pulse" : ""
        }`}
      />
      <div className="absolute inset-0 rounded-full border border-[#1E293B]/90 bg-[#0E1324]/80 shadow-[0_0_60px_rgba(37,99,235,0.1),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md" />
      <div className="absolute inset-[10px] rounded-full border border-[#2563EB]/12 bg-gradient-to-br from-[#2563EB]/[0.06] via-transparent to-transparent" />

      <div
        key={contentKey}
        className="relative z-10 flex h-full flex-col items-center justify-center px-5 text-center motion-safe:animate-step-in motion-reduce:animate-none"
      >
        {activeModule ? (
          <>
            <p className="text-[0.625rem] font-semibold tracking-[0.24em] text-[#60A5FA] uppercase sm:text-xs">
              {activeModule.centerTitle}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#94A3B8] sm:text-base">
              {activeModule.description}
            </p>
            <Link
              href={href}
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#60A5FA] transition-colors hover:text-[#93C5FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]"
            >
              {cta}
              <span aria-hidden="true">→</span>
            </Link>
          </>
        ) : (
          <>
            <div className="flex h-[46%] w-[46%] items-center justify-center">
              <Image
                src="/artecium-logo.png"
                alt={logoAlt}
                width={96}
                height={96}
                className="h-full w-full object-contain"
              />
            </div>
            <p className="mt-2 text-[0.625rem] font-semibold tracking-[0.28em] text-white/90 uppercase sm:text-xs">
              {defaultLabel}
            </p>
            <p className="mt-1.5 text-xs text-[#64748B]">{defaultSubtitle}</p>
          </>
        )}
      </div>
    </div>
  );
}

interface ConnectionLinesProps {
  containerSize: number;
  centerSize: number;
  radius: number;
  moduleCount: number;
  activeIndex: number | null;
  enableLineMotion: boolean;
}

function ConnectionLines({
  containerSize,
  centerSize,
  radius,
  moduleCount,
  activeIndex,
  enableLineMotion,
}: ConnectionLinesProps) {
  const cx = containerSize / 2;
  const cy = containerSize / 2;
  const hubRadius = centerSize / 2 - 4;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${containerSize} ${containerSize}`}
      aria-hidden="true"
    >
      {Array.from({ length: moduleCount }, (_, index) => {
        const pos = getModulePosition(index, moduleCount, radius, containerSize);
        const isActive = activeIndex === index;
        const dx = pos.x - cx;
        const dy = pos.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nx = dx / dist;
        const ny = dy / dist;
        const x1 = cx + nx * hubRadius;
        const y1 = cy + ny * hubRadius;
        const x2 = pos.x - nx * 28;
        const y2 = pos.y - ny * 28;

        return (
          <line
            key={index}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isActive ? "#2563EB" : "#1E293B"}
            strokeWidth={isActive ? 1.5 : 1}
            strokeOpacity={isActive ? 0.75 : 0.45}
            strokeDasharray={isActive ? "6 4" : "4 6"}
            className={
              isActive && enableLineMotion
                ? "motion-safe:animate-ai-line-flow"
                : undefined
            }
          />
        );
      })}
    </svg>
  );
}

interface ModuleNodeProps {
  module: ModuleCopy;
  isActive: boolean;
  isDimmed: boolean;
  width?: number;
  onActivate: (id: ModuleId) => void;
  onDeactivate: () => void;
  onNavigate: (id: ModuleId) => void;
  isDesktop: boolean;
}

function ModuleNode({
  module,
  isActive,
  isDimmed,
  width,
  onActivate,
  onDeactivate,
  onNavigate,
  isDesktop,
}: ModuleNodeProps) {
  return (
    <button
      type="button"
      aria-label={module.ariaLabel}
      aria-pressed={isActive}
      onMouseEnter={() => {
        if (isDesktop) onActivate(module.id);
      }}
      onMouseLeave={() => {
        if (isDesktop) onDeactivate();
      }}
      onFocus={() => onActivate(module.id)}
      onBlur={(event) => {
        if (
          isDesktop &&
          !event.currentTarget.contains(event.relatedTarget as Node | null)
        ) {
          onDeactivate();
        }
      }}
      onClick={() => onNavigate(module.id)}
      style={width ? { width } : undefined}
      className={`group flex w-full items-center gap-2 rounded-xl border bg-[#0E1324]/85 px-3 py-2.5 text-left backdrop-blur-sm transition-all duration-300 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816] ${
        isActive
          ? "scale-[1.04] border-[#2563EB]/55 bg-[#0E1324] shadow-[0_0_28px_rgba(37,99,235,0.18)]"
          : isDimmed
            ? "border-[#1E293B]/60 opacity-55"
            : "border-[#1E293B] hover:border-[#2563EB]/30 hover:opacity-100"
      }`}
    >
      <span
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors duration-300 ${
          isActive
            ? "border-[#2563EB]/40 bg-[#2563EB]/10 text-[#60A5FA]"
            : "border-[#1E293B] bg-[#050816] text-[#2563EB]"
        }`}
      >
        {moduleIcons[module.id]}
      </span>
      <span className="text-xs font-semibold leading-tight text-white sm:text-sm">
        {module.name}
      </span>
    </button>
  );
}

interface RadialHubProps {
  modules: ModuleCopy[];
  dims: HubDimensions;
  activeId: ModuleId | null;
  onActivate: (id: ModuleId) => void;
  onDeactivate: () => void;
  onNavigate: (id: ModuleId) => void;
  isDesktop: boolean;
  enableLineMotion: boolean;
  centerProps: Omit<AIHubCenterProps, "size" | "activeModule"> & {
    activeModule: ModuleCopy | null;
  };
}

function RadialHub({
  modules,
  dims,
  activeId,
  onActivate,
  onDeactivate,
  onNavigate,
  isDesktop,
  enableLineMotion,
  centerProps,
}: RadialHubProps) {
  const activeIndex = activeId
    ? modules.findIndex((m) => m.id === activeId)
    : null;

  return (
    <div
      className="relative mx-auto motion-safe:animate-step-in motion-reduce:animate-none"
      style={{ width: dims.container, height: dims.container }}
      onMouseLeave={() => {
        if (isDesktop) onDeactivate();
      }}
    >
      <ConnectionLines
        containerSize={dims.container}
        centerSize={dims.center}
        radius={dims.radius}
        moduleCount={modules.length}
        activeIndex={activeIndex}
        enableLineMotion={enableLineMotion}
      />

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <AIHubCenter size={dims.center} {...centerProps} />
      </div>

      {modules.map((module, index) => {
        const pos = getModulePosition(
          index,
          modules.length,
          dims.radius,
          dims.container,
        );
        const isActive = activeId === module.id;
        const isDimmed = activeId !== null && !isActive;

        return (
          <div
            key={module.id}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: pos.x, top: pos.y }}
          >
            <ModuleNode
              module={module}
              isActive={isActive}
              isDimmed={isDimmed}
              width={dims.moduleWidth}
              onActivate={onActivate}
              onDeactivate={onDeactivate}
              onNavigate={onNavigate}
              isDesktop={isDesktop}
            />
          </div>
        );
      })}
    </div>
  );
}

export function AIAutomation() {
  const t = useTranslations("home.aiAutomation");
  const locale = resolveLocale(useLocale());
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const prefersReducedMotion = usePrefersReducedMotion();
  const dims = useHubDimensions();
  const sectionId = useId();
  const [activeId, setActiveId] = useState<ModuleId | null>(null);

  const href = getServicePath("ia", locale);

  const modules = useMemo<ModuleCopy[]>(
    () =>
      MODULE_IDS.map((id) => ({
        id,
        name: t(`modules.${id}.name`),
        centerTitle: t(`modules.${id}.centerTitle`),
        description: t(`modules.${id}.description`),
        ariaLabel: t(`modules.${id}.ariaLabel`),
      })),
    [t],
  );

  const activeModule = activeId
    ? (modules.find((m) => m.id === activeId) ?? null)
    : null;

  const handleNavigate = useCallback(
    (id: ModuleId) => {
      if (isDesktop || activeId === id) {
        router.push(href);
        return;
      }
      setActiveId(id);
    },
    [activeId, href, isDesktop, router],
  );

  const centerProps = {
    activeModule,
    logoAlt: t("logoAlt"),
    defaultLabel: t("defaultLabel"),
    defaultSubtitle: t("defaultSubtitle"),
    cta: t("cta"),
    href,
    enablePulse: !prefersReducedMotion,
  };

  return (
    <section
      id="ai-automation"
      aria-labelledby={`${sectionId}-heading`}
      className="overflow-x-hidden border-t border-[#1E293B]/60 bg-[#050816] px-6 py-24 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title={t("title")}
          description={t("description")}
          titleId={`${sectionId}-heading`}
        />

        <div className="mt-16">
          {dims.isMobile ? (
            <div className="flex flex-col items-center gap-8">
              <AIHubCenter size={dims.center} {...centerProps} />

              <div
                className="grid w-full max-w-md grid-cols-2 gap-3"
                role="list"
              >
                {modules.map((module) => {
                  const isActive = activeId === module.id;
                  const isDimmed = activeId !== null && !isActive;

                  return (
                    <div key={module.id} role="listitem">
                      <ModuleNode
                        module={module}
                        isActive={isActive}
                        isDimmed={isDimmed}
                        onActivate={setActiveId}
                        onDeactivate={() => setActiveId(null)}
                        onNavigate={handleNavigate}
                        isDesktop={false}
                      />
                    </div>
                  );
                })}
              </div>

              {activeId && (
                <p className="max-w-sm text-center text-xs text-[#64748B]">
                  {t("mobileHint")}
                </p>
              )}
            </div>
          ) : (
            <RadialHub
              modules={modules}
              dims={dims}
              activeId={activeId}
              onActivate={setActiveId}
              onDeactivate={() => setActiveId(null)}
              onNavigate={handleNavigate}
              isDesktop={isDesktop}
              enableLineMotion={!prefersReducedMotion}
              centerProps={centerProps}
            />
          )}
        </div>

        <nav aria-label={t("navLabel")} className="sr-only">
          <ul>
            {modules.map((module) => (
              <li key={module.id}>
                <Link href={href}>
                  {module.name} — {module.description}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
