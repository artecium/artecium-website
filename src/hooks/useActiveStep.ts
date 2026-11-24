"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const DESKTOP_ROOT_MARGIN = "-45% 0px -45% 0px";
const MOBILE_ROOT_MARGIN = "-38% 0px -38% 0px";
const DESKTOP_MEDIA = "(min-width: 1024px)";

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

function pickActiveIndex(
  entries: IntersectionObserverEntry[],
  stepRefs: { current: (HTMLElement | null)[] },
): number | null {
  const intersecting = entries.filter((e) => e.isIntersecting);
  if (intersecting.length === 0) return null;

  let best = intersecting[0];
  for (const entry of intersecting) {
    if (entry.intersectionRatio > best.intersectionRatio) {
      best = entry;
    }
  }

  const idx = stepRefs.current.indexOf(best.target as HTMLElement);
  return idx >= 0 ? idx : null;
}

/**
 * Highlights the step whose element is closest to the viewport centre (via rootMargin).
 */
export function useActiveStep(stepCount: number) {
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [observerReady, setObserverReady] = useState(false);
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  const setStepRef = useCallback((index: number) => {
    return (node: HTMLElement | null) => {
      stepRefs.current[index] = node;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || stepCount === 0) {
      return;
    }

    const desktopMq = window.matchMedia(DESKTOP_MEDIA);
    const getRootMargin = () =>
      desktopMq.matches ? DESKTOP_ROOT_MARGIN : MOBILE_ROOT_MARGIN;

    let observer: IntersectionObserver | null = null;
    let readyRaf = 0;

    const attach = () => {
      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          const next = pickActiveIndex(entries, stepRefs);
          if (next !== null) {
            setActiveIndex((prev) => (prev === next ? prev : next));
          }
        },
        {
          root: null,
          rootMargin: getRootMargin(),
          threshold: [0, 0.15, 0.35, 0.5, 0.65, 0.85, 1],
        },
      );

      for (const el of stepRefs.current) {
        if (el) observer.observe(el);
      }

      readyRaf = window.requestAnimationFrame(() => setObserverReady(true));
    };

    attach();
    desktopMq.addEventListener("change", attach);

    return () => {
      desktopMq.removeEventListener("change", attach);
      window.cancelAnimationFrame(readyRaf);
      observer?.disconnect();
    };
  }, [stepCount, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || stepCount === 0) {
      const resetRaf = window.requestAnimationFrame(() => setObserverReady(false));
      return () => window.cancelAnimationFrame(resetRaf);
    }
    return undefined;
  }, [reduceMotion, stepCount]);

  const interactive = observerReady && !reduceMotion;

  return {
    activeIndex,
    setStepRef,
    interactive,
    reduceMotion,
  };
}
