"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** Rotation speed: full orbit in ~30 seconds (reference uses setInterval + angle increment). */
const ROTATION_STEP_DEG = 0.6;
const ROTATION_INTERVAL_MS = 50;

export interface OrbitServiceNode {
  id: string;
  name: string;
  centerTitle: string;
  headline: string;
  tags: string;
  shortDescription: string;
  ariaLabel: string;
  href: string;
  icon: ReactNode;
}

export interface RadialOrbitalServicesProps {
  nodes: OrbitServiceNode[];
  containerSize: number;
  radius: number;
  centerSize: number;
  cardWidth: number;
  cardHeight: number;
  enableRotation: boolean;
  activeId: string | null;
  onActivate: (id: string) => void;
  onDeactivate: () => void;
  onNavigate: (id: string, href: string) => void;
  isDesktop: boolean;
  logoAlt: string;
  defaultTitle: string;
  viewServiceLabel: string;
}

interface NodePosition {
  x: number;
  y: number;
  zIndex: number;
  opacity: number;
}

function calculateNodePosition(
  index: number,
  total: number,
  rotationAngle: number,
  radius: number,
): NodePosition {
  const angle = ((index / total) * 360 + rotationAngle - 90) % 360;
  const radian = (angle * Math.PI) / 180;

  const x = radius * Math.cos(radian);
  const y = radius * Math.sin(radian);

  const zIndex = Math.round(100 + 50 * Math.cos(radian));
  const opacity = Math.max(
    0.72,
    Math.min(1, 0.72 + 0.28 * ((1 + Math.sin(radian)) / 2)),
  );

  return { x, y, zIndex, opacity };
}

function OrbitRings({
  containerSize,
  radius,
  centerSize,
}: {
  containerSize: number;
  radius: number;
  centerSize: number;
}) {
  const cx = containerSize / 2;
  const inner = centerSize / 2 + 12;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${containerSize} ${containerSize}`}
      aria-hidden="true"
    >
      <circle
        cx={cx}
        cy={cx}
        r={radius + 24}
        fill="none"
        stroke="#2563EB"
        strokeWidth="1"
        strokeOpacity="0.1"
      />
      <circle
        cx={cx}
        cy={cx}
        r={radius}
        fill="none"
        stroke="#1E293B"
        strokeWidth="1"
        strokeDasharray="4 7"
        strokeOpacity="0.5"
      />
      <circle
        cx={cx}
        cy={cx}
        r={inner}
        fill="none"
        stroke="#2563EB"
        strokeWidth="0.75"
        strokeOpacity="0.18"
      />
    </svg>
  );
}

function OrbitHub({
  size,
  activeNode,
  logoAlt,
  defaultTitle,
  viewServiceLabel,
}: {
  size: number;
  activeNode: OrbitServiceNode | null;
  logoAlt: string;
  defaultTitle: string;
  viewServiceLabel: string;
}) {
  const contentKey = activeNode?.id ?? "default";

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 z-[300] -translate-x-1/2 -translate-y-1/2"
      style={{ width: size, height: size }}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="absolute inset-0 rounded-full bg-[#2563EB]/[0.05] blur-2xl motion-reduce:hidden" />
      <div className="absolute inset-0 rounded-full border border-[#1E293B]/90 bg-[#0E1324]/80 shadow-[0_0_80px_rgba(37,99,235,0.12),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md" />
      <div className="absolute inset-[10px] rounded-full border border-[#2563EB]/15 bg-gradient-to-br from-[#2563EB]/[0.08] via-transparent to-transparent" />
      <div className="absolute inset-[3px] rounded-full border border-white/[0.04]" />

      <div
        key={contentKey}
        className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center motion-safe:animate-step-in motion-reduce:animate-none"
      >
        {activeNode ? (
          <>
            <p className="text-[0.625rem] font-semibold tracking-[0.28em] text-[#60A5FA] uppercase sm:text-xs">
              {activeNode.centerTitle}
            </p>
            <p className="mt-2 text-sm font-semibold leading-snug text-white sm:text-base">
              {activeNode.headline}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#94A3B8]">
              {activeNode.tags}
            </p>
            <Link
              href={activeNode.href}
              className="pointer-events-auto mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#60A5FA] transition-colors hover:text-[#93C5FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]"
            >
              {viewServiceLabel}
              <span aria-hidden="true">→</span>
            </Link>
          </>
        ) : (
          <>
            <div className="flex h-[52%] w-[52%] items-center justify-center">
              <Image
                src="/artecium-logo.png"
                alt={logoAlt}
                width={120}
                height={120}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <p className="mt-2 text-xs text-[#94A3B8] sm:text-sm">{defaultTitle}</p>
          </>
        )}
      </div>
    </div>
  );
}

export function RadialOrbitalServices({
  nodes,
  containerSize,
  radius,
  centerSize,
  cardWidth,
  cardHeight,
  enableRotation,
  activeId,
  onActivate,
  onDeactivate,
  onNavigate,
  isDesktop,
  logoAlt,
  defaultTitle,
  viewServiceLabel,
}: RadialOrbitalServicesProps) {
  const [rotationAngle, setRotationAngle] = useState(0);
  const [autoRotate, setAutoRotate] = useState(enableRotation);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);

  const activeNode = nodes.find((node) => node.id === activeId) ?? null;

  useEffect(() => {
    setAutoRotate(enableRotation && activeId === null);
  }, [enableRotation, activeId]);

  useEffect(() => {
    if (!autoRotate) return;

    const timer = window.setInterval(() => {
      setRotationAngle((prev) => Number(((prev + ROTATION_STEP_DEG) % 360).toFixed(3)));
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [autoRotate]);

  const handleContainerClick = useCallback(
    (event: React.MouseEvent) => {
      if (
        event.target === containerRef.current ||
        event.target === orbitRef.current
      ) {
        onDeactivate();
        setAutoRotate(enableRotation);
      }
    },
    [enableRotation, onDeactivate],
  );

  const handleActivate = useCallback(
    (id: string) => {
      onActivate(id);
      setAutoRotate(false);
    },
    [onActivate],
  );

  const handleDeactivate = useCallback(() => {
    onDeactivate();
    if (enableRotation) setAutoRotate(true);
  }, [enableRotation, onDeactivate]);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto select-none"
      style={{ width: containerSize, height: containerSize }}
      onClick={handleContainerClick}
      onMouseLeave={() => {
        if (isDesktop) handleDeactivate();
      }}
    >
      <OrbitRings
        containerSize={containerSize}
        radius={radius}
        centerSize={centerSize}
      />

      <OrbitHub
        size={centerSize}
        activeNode={activeNode}
        logoAlt={logoAlt}
        defaultTitle={defaultTitle}
        viewServiceLabel={viewServiceLabel}
      />

      <div
        ref={orbitRef}
        className="absolute inset-0 flex items-center justify-center"
      >
        {nodes.map((node, index) => {
          const position = calculateNodePosition(
            index,
            nodes.length,
            rotationAngle,
            radius,
          );
          const isActive = activeId === node.id;

          return (
            <div
              key={node.id}
              className="absolute left-1/2 top-1/2 transition-all duration-500 motion-reduce:transition-none"
              style={{
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                zIndex: isActive ? 250 : position.zIndex,
                opacity: isActive ? 1 : position.opacity,
              }}
            >
              <button
                type="button"
                aria-label={node.ariaLabel}
                aria-pressed={isActive}
                onMouseEnter={() => {
                  if (isDesktop) handleActivate(node.id);
                }}
                onFocus={() => handleActivate(node.id)}
                onBlur={(event) => {
                  if (
                    isDesktop &&
                    !event.currentTarget.contains(event.relatedTarget as Node | null)
                  ) {
                    handleDeactivate();
                  }
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onNavigate(node.id, node.href);
                }}
                style={{ width: cardWidth, minHeight: cardHeight }}
                className={`group flex flex-col items-center justify-center gap-1.5 rounded-2xl border bg-[#0E1324]/90 px-3 py-2.5 text-center backdrop-blur-sm transition-all duration-300 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816] ${
                  isActive
                    ? "scale-[1.05] border-[#2563EB]/60 bg-[#0E1324] shadow-[0_0_36px_rgba(37,99,235,0.24)]"
                    : "border-[#1E293B] hover:border-[#2563EB]/35 hover:shadow-[0_0_24px_rgba(37,99,235,0.12)]"
                }`}
              >
                <span
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors duration-300 ${
                    isActive
                      ? "border-[#2563EB]/45 bg-[#2563EB]/12 text-[#60A5FA]"
                      : "border-[#1E293B] bg-[#050816] text-[#2563EB] group-hover:border-[#2563EB]/30"
                  }`}
                >
                  {node.icon}
                </span>
                <span className="block text-sm font-semibold text-white">
                  {node.name}
                </span>
                <span
                  className={`overflow-hidden text-xs leading-relaxed text-[#94A3B8] transition-all duration-300 motion-reduce:transition-none ${
                    isActive
                      ? "max-h-16 opacity-100"
                      : "max-h-0 opacity-0 md:max-h-0 md:opacity-0 md:group-hover:max-h-16 md:group-hover:opacity-100"
                  }`}
                >
                  {node.shortDescription}
                </span>
                <span
                  className={`overflow-hidden text-[0.6875rem] font-medium tracking-wide text-[#2563EB] transition-all duration-300 motion-reduce:transition-none ${
                    isActive
                      ? "max-h-8 opacity-100"
                      : "max-h-0 opacity-0 md:max-h-0 md:opacity-0 md:group-hover:max-h-8 md:group-hover:opacity-100"
                  }`}
                >
                  {node.tags}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
