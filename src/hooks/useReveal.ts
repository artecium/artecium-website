"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const THRESHOLD = 0.15;

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function subscribeMounted() {
  return () => {};
}

function getMountedSnapshot() {
  return true;
}

function getMountedServerSnapshot() {
  return false;
}

type RevealVariant = "default" | "stack";

const REVEAL_CLASSES: Record<RevealVariant, { hidden: string; shown: string }> = {
  default: {
    hidden: "translate-y-12 opacity-0",
    shown: "translate-y-0 opacity-100",
  },
  stack: {
    hidden: "translate-y-[90px] -rotate-3 opacity-20",
    shown: "translate-y-0 rotate-0 opacity-100",
  },
};

type UseRevealOptions = {
  /** Stagger delay in ms for cascade (e.g. 80 per list item). */
  cascadeDelayMs?: number;
  threshold?: number;
  rootMargin?: string;
  variant?: RevealVariant;
};

/**
 * Reveal-on-scroll once. Content stays visible for SSR, pre-hydration, and reduced-motion.
 */
export function useReveal(options: UseRevealOptions = {}) {
  const {
    cascadeDelayMs = 0,
    threshold = THRESHOLD,
    rootMargin = "0px",
    variant = "default",
  } = options;
  const variantClasses = REVEAL_CLASSES[variant];
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const mounted = useSyncExternalStore(subscribeMounted, getMountedSnapshot, getMountedServerSnapshot);
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  const motionEnabled = mounted && !reduceMotion;

  useEffect(() => {
    if (!motionEnabled || revealed) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [motionEnabled, revealed, threshold, rootMargin]);

  const showRevealed = !motionEnabled || revealed;

  const revealClass = showRevealed ? variantClasses.shown : variantClasses.hidden;

  const transitionStyle =
    motionEnabled && !showRevealed
      ? undefined
      : motionEnabled
        ? {
            transitionProperty: "opacity, transform",
            transitionDuration: "600ms",
            transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
            transitionDelay: `${cascadeDelayMs}ms`,
          }
        : undefined;

  return {
    ref,
    revealClass,
    transitionStyle,
    reduceMotion,
    motionEnabled,
  };
}
