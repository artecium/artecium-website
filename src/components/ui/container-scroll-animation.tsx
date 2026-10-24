"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface ContainerScrollProps {
  titleComponent: ReactNode;
  children: ReactNode;
}

function ScrollDashboard({
  scale,
  rotateX,
  translateY,
  children,
}: {
  scale: MotionValue<number>;
  rotateX: MotionValue<number>;
  translateY: MotionValue<number>;
  children: ReactNode;
}) {
  return (
    <motion.div
      style={{
        scale,
        rotateX,
        y: translateY,
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
      }}
      className="mx-auto w-full max-w-6xl origin-center will-change-transform"
    >
      <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-3 md:p-4">
        <div className="h-[14rem] overflow-hidden rounded-xl sm:h-[18rem] md:h-[26rem] lg:h-[30rem] xl:h-[34rem]">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

function StaticLayout({
  titleComponent,
  children,
}: {
  titleComponent: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">{titleComponent}</div>
      <div className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-3 md:p-4">
          <div className="h-[14rem] overflow-hidden rounded-xl sm:h-[18rem] md:h-[26rem] lg:h-[30rem]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContainerScroll({
  titleComponent,
  children,
}: ContainerScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const scaleRange = isMobile ? [0.78, 0.94, 0.88] : [0.68, 1, 0.92];
  const rotateRange = isMobile ? [14, 0, -3] : [24, 0, -5];
  const translateRange = isMobile ? [72, 0, -20] : [120, 0, -32];

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], scaleRange);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], rotateRange);
  const translateY = useTransform(scrollYProgress, [0, 0.5, 1], translateRange);

  if (prefersReducedMotion) {
    return (
      <div ref={containerRef}>
        <StaticLayout titleComponent={titleComponent}>{children}</StaticLayout>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 text-center sm:px-6 md:pb-14">
        {titleComponent}
      </div>

      <div
        ref={containerRef}
        className="overflow-x-clip px-4 pb-28 pt-4 sm:px-6 lg:px-8"
      >
        <div
          className="mx-auto flex w-full max-w-6xl flex-col items-center"
          style={{ perspective: "1200px" }}
        >
          <ScrollDashboard
            scale={scale}
            rotateX={rotateX}
            translateY={translateY}
          >
            {children}
          </ScrollDashboard>
        </div>
      </div>
    </div>
  );
}
