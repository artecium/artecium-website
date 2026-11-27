"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

const PREVIEW_FRAME = {
  client: {
    width: 520,
    height: 320,
    /** 0 = crop pelo topo; valores baixos mantêm barra do browser + dashboard. */
    objectPositionY: 0.06,
  },
  booking: {
    width: 480,
    height: 296,
    objectPositionY: 0.05,
  },
} as const;

function fallbackCoverScale(variant: keyof typeof PREVIEW_FRAME): number {
  const spec = PREVIEW_FRAME[variant];
  return Math.max(1.24, 320 / spec.width, 130 / spec.height);
}

type AreaHubPreviewCoverProps = {
  children: ReactNode;
  variant: "client" | "booking";
  /** Altura fixa do retângulo (ex.: h-[7.25rem] sm:h-[8rem]). */
  className?: string;
};

/**
 * Escala o preview de dashboard para preencher o retângulo (cover), sem barras vazias.
 * Usado nos cartões da grelha e no modal expandido.
 */
export function AreaHubPreviewCover({
  children,
  variant,
  className = "",
}: AreaHubPreviewCoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<CSSProperties | null>(null);
  const spec = PREVIEW_FRAME[variant];
  const fallbackScale = fallbackCoverScale(variant);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;

      const scale = Math.max(width / spec.width, height / spec.height);
      const renderedHeight = spec.height * scale;
      const offsetY = (height - renderedHeight) * spec.objectPositionY;

      setLayout({
        width: spec.width,
        height: spec.height,
        transform: `translateX(-50%) translateY(${offsetY}px) scale(${scale})`,
      });
      container.dataset.previewReady = "true";
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [spec.height, spec.objectPositionY, spec.width]);

  const frameStyle: CSSProperties =
    layout ?? {
      width: spec.width,
      height: spec.height,
      transform: `translateX(-50%) translateY(0px) scale(${fallbackScale})`,
    };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-[#050816] ${className}`.trim()}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute top-0 left-1/2 block origin-top"
          style={frameStyle}
        >
          <div className="block size-full [&>*]:block [&>*]:!size-full [&>*]:!max-w-none [&_img]:block [&_img]:!size-full [&_img]:object-cover">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}