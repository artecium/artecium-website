"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";

export type BeforeAfterSliderProps = {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  initialPercent?: number;
  beforeImageClassName?: string;
  afterImageClassName?: string;
  className?: string;
};

const MIN = 0;
const MAX = 100;

function clamp(n: number) {
  return Math.min(MAX, Math.max(MIN, n));
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  initialPercent = 50,
  beforeImageClassName = "",
  afterImageClassName = "",
  className = "",
}: BeforeAfterSliderProps) {
  const labelId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const [percent, setPercent] = useState(clamp(initialPercent));
  const [isDragging, setIsDragging] = useState(false);
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = clientX - rect.left;
    setPercent(clamp((x / rect.width) * 100));
  }, []);

  useEffect(() => {
    const stop = () => {
      dragging.current = false;
      setIsDragging(false);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      updateFromClientX(e.clientX);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [updateFromClientX]);

  const startDrag = (e: React.PointerEvent) => {
    dragging.current = true;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const onTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button[role=slider]")) return;
    dragging.current = true;
    setIsDragging(true);
    updateFromClientX(e.clientX);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPercent((p) => clamp(p - step));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPercent((p) => clamp(p + step));
    } else if (e.key === "Home") {
      e.preventDefault();
      setPercent(MIN);
    } else if (e.key === "End") {
      e.preventDefault();
      setPercent(MAX);
    }
  };

  return (
    <div className={`select-none ${className}`} data-before-after-slider>
      <div
        ref={trackRef}
        className="relative aspect-[4/5] w-full touch-none overflow-hidden rounded-sm bg-[#ebe6de] sm:aspect-[16/11]"
        style={{ WebkitUserSelect: "none", userSelect: "none" }}
        onPointerDown={onTrackPointerDown}
      >
        {/* Antes — fundo */}
        <Image
          src={beforeSrc}
          alt={beforeAlt}
          fill
          draggable={false}
          className={`pointer-events-none object-cover object-center ${beforeImageClassName}`}
          sizes="(max-width: 768px) 100vw, min(900px, 80vw)"
        />

        {/* Depois — recorte à direita do divisor */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${percent}%)` }}
        >
          <Image
            src={afterSrc}
            alt={afterAlt}
            fill
            draggable={false}
            className={`pointer-events-none object-cover object-center ${afterImageClassName}`}
            sizes="(max-width: 768px) 100vw, min(900px, 80vw)"
          />
        </div>

        <span className="pointer-events-none absolute top-4 left-4 z-10 rounded-full bg-[#f7f4ef]/90 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[#5c6558] uppercase backdrop-blur-sm">
          Antes
        </span>
        <span className="pointer-events-none absolute top-4 right-4 z-10 rounded-full bg-[#f7f4ef]/90 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[#5c6558] uppercase backdrop-blur-sm">
          Depois
        </span>

        <div
          className="pointer-events-none absolute inset-y-0 z-20 w-px -translate-x-1/2 bg-white/95 shadow-[0_0_0_1px_rgba(44,52,40,0.06)]"
          style={{ left: `${percent}%` }}
          aria-hidden
        />

        <button
          type="button"
          role="slider"
          aria-labelledby={labelId}
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-valuenow={Math.round(percent)}
          aria-label="Comparar imagem antes e depois"
          className="absolute top-1/2 z-30 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center rounded-full border border-[#e0dbd2] bg-[#faf8f5] text-[#5c6558] shadow-[0_8px_28px_rgba(44,52,40,0.12)] transition-[box-shadow,transform] duration-150 hover:scale-[1.02] hover:shadow-[0_10px_32px_rgba(44,52,40,0.14)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8a9a7b]/50 active:scale-[0.98]"
          style={{
            left: `${percent}%`,
            transition: isDragging ? "none" : undefined,
          }}
          onPointerDown={startDrag}
          onKeyDown={onKeyDown}
        >
          <span id={labelId} className="sr-only">
            Divisor antes e depois
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M8 8l-3 4 3 4M16 8l3 4-3 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}