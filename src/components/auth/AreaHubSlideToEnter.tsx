"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const HANDLE_SIZE_PX = 44;
const CONFIRM_THRESHOLD = 0.9;

type AreaHubSlideToEnterProps = {
  accent: "client" | "booking";
  ariaLabel: string;
  hint: string;
  onConfirm: () => void;
};

function SlideArrow() {
  return (
    <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

const accentHandle = {
  client: {
    handle:
      "border-[#1E293B] bg-[#0B1224] text-[#94A3B8] shadow-[0_2px_12px_rgba(0,0,0,0.35)] hover:border-[#334155] active:border-[#2563EB]/50",
    progress: "from-[#2563EB]/25 to-[#2563EB]/05",
    focus: "focus-visible:ring-[#2563EB]/55",
  },
  booking: {
    handle:
      "border-[#1E293B] bg-[#0B1224] text-[#94A3B8] shadow-[0_2px_12px_rgba(0,0,0,0.35)] hover:border-[#334155] active:border-[#14B8A6]/50",
    progress: "from-[#14B8A6]/25 to-[#14B8A6]/05",
    focus: "focus-visible:ring-[#14B8A6]/45",
  },
} as const;

export function AreaHubSlideToEnter({
  accent,
  ariaLabel,
  hint,
  onConfirm,
}: AreaHubSlideToEnterProps) {
  const reduceMotion = useReducedMotion();
  const styles = accentHandle[accent];
  const trackRef = useRef<HTMLDivElement>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [maxDrag, setMaxDrag] = useState(0);
  const x = useMotionValue(0);
  const progressWidth = useTransform(x, (value) => `${HANDLE_SIZE_PX + value}px`);
  const hintId = useId();

  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const measure = () => {
      setMaxDrag(Math.max(0, el.clientWidth - HANDLE_SIZE_PX));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const springBack = useCallback(() => {
    animate(x, 0, {
      type: "spring",
      stiffness: 520,
      damping: 38,
      mass: 0.85,
    });
  }, [x]);

  const complete = useCallback(() => {
    if (confirmed) return;
    setConfirmed(true);
    void animate(x, maxDrag, { duration: reduceMotion ? 0 : 0.12 }).then(() => {
      onConfirm();
    });
  }, [confirmed, maxDrag, onConfirm, reduceMotion, x]);

  const evaluateDragEnd = useCallback(() => {
    if (confirmed || maxDrag <= 0) return;
    if (x.get() >= maxDrag * CONFIRM_THRESHOLD) {
      complete();
    } else {
      springBack();
    }
  }, [complete, confirmed, maxDrag, springBack, x]);

  useEffect(() => {
    if (maxDrag > 0) {
      x.set(Math.min(x.get(), maxDrag));
    }
  }, [maxDrag, x]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (confirmed) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      complete();
      return;
    }

    if (reduceMotion) return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      const step = maxDrag * 0.12;
      const next = Math.min(maxDrag, x.get() + step);
      x.set(next);
      if (next >= maxDrag * CONFIRM_THRESHOLD) {
        complete();
      }
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const step = maxDrag * 0.12;
      x.set(Math.max(0, x.get() - step));
    }

    if (event.key === "Escape") {
      springBack();
    }
  };

  return (
    <div
      ref={trackRef}
      data-slide-enter
      className="relative h-11 w-[min(100%,11.5rem)] min-w-[8.75rem] shrink-0 touch-none select-none sm:w-[13.5rem]"
    >
      <div
        className="absolute inset-0 rounded-full border border-[#1E293B]/90 bg-[#050816]/70"
        aria-hidden
      />
      <motion.div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${styles.progress}`}
        style={{ width: progressWidth, opacity: 0.9 }}
      />
      <motion.button
        type="button"
        aria-label={ariaLabel}
        aria-describedby={hintId}
        aria-keyshortcuts="Enter Space ArrowRight"
        disabled={confirmed}
        drag={reduceMotion ? false : "x"}
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0.04}
        dragMomentum={false}
        style={{ x, width: HANDLE_SIZE_PX, height: HANDLE_SIZE_PX }}
        onDragEnd={evaluateDragEnd}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (reduceMotion) complete();
        }}
        onKeyDown={onKeyDown}
        className={`absolute top-1/2 left-0 z-[1] -translate-y-1/2 cursor-grab rounded-full border active:cursor-grabbing ${styles.handle} ${styles.focus} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1F] disabled:opacity-60`}
      >
        <span className="flex h-full w-full items-center justify-center">
          <SlideArrow />
        </span>
      </motion.button>
      <p id={hintId} className="sr-only">
        {hint}
      </p>
    </div>
  );
}