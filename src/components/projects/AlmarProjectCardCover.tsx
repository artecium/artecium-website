"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface AlmarProjectCardCoverProps {
  coverVideo: string;
}

const ALMAR_LOGO_SRC = "/projects/almar/logo.png";

const NAV_FULL = [
  "HOME",
  "EXPERIENCE",
  "DINING",
  "EVENTS",
  "GALLERY",
  "CONTACT",
] as const;

const NAV_COMPACT = ["HOME", "DINING", "EVENTS"] as const;

export function AlmarProjectCardCover({ coverVideo }: AlmarProjectCardCoverProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion) {
      return;
    }
    void video.play().catch(() => {});
  }, [coverVideo, reduceMotion]);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <video
        ref={videoRef}
        src={coverVideo}
        muted
        loop
        playsInline
        autoPlay={!reduceMotion}
        preload="metadata"
        controls={false}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/65" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.25)_100%)]" />

      <div className="relative flex h-full min-h-0 flex-col text-white">
        <div className="flex items-center justify-between gap-2 px-2.5 pt-2 sm:px-4 sm:pt-3">
          <Image
            src={ALMAR_LOGO_SRC}
            alt="Almar Beach Club"
            width={96}
            height={96}
            className="h-3.5 w-auto shrink-0 object-contain sm:h-4"
          />

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-x-2 gap-y-0.5 md:flex md:flex-wrap md:justify-center lg:gap-x-3">
            {NAV_FULL.map((item) => (
              <span
                key={item}
                className="text-[0.5rem] tracking-[0.14em] text-white/75 uppercase lg:text-[0.5625rem]"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2 md:hidden">
            {NAV_COMPACT.map((item) => (
              <span
                key={item}
                className="text-[0.4375rem] tracking-[0.12em] text-white/70 uppercase sm:text-[0.5rem]"
              >
                {item}
              </span>
            ))}
          </div>

          <span className="shrink-0 rounded border border-white/35 bg-white/5 px-1.5 py-0.5 text-[0.4375rem] tracking-[0.16em] text-white/90 uppercase sm:px-2 sm:text-[0.5rem]">
            Reserve
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-3 py-2 text-center sm:px-6">
          <p className="font-serif text-[1.75rem] leading-none font-light tracking-tight text-white sm:text-4xl md:text-[2.75rem]">
            Experience
          </p>
          <Image
            src={ALMAR_LOGO_SRC}
            alt="Almar Beach Club"
            width={384}
            height={384}
            className="mt-2 h-12 w-auto object-contain sm:mt-3 sm:h-16 md:h-[4.5rem]"
          />
          <p className="mt-2 max-w-[16rem] text-[0.5625rem] leading-relaxed text-white/75 sm:mt-3 sm:max-w-xs sm:text-[0.6875rem]">
            One unforgettable day by the sea.
          </p>

          <div className="mt-3 flex max-w-full flex-col items-stretch gap-1.5 sm:mt-4 sm:flex-row sm:items-center sm:justify-center sm:gap-2">
            <span className="truncate rounded-sm bg-[#f5f0e8]/95 px-2 py-1 text-center text-[0.4375rem] font-medium tracking-[0.08em] text-[#1a1510] uppercase sm:max-w-[11rem] sm:px-3 sm:py-1.5 sm:text-[0.5rem]">
              Reserve your experience
            </span>
            <span className="truncate rounded-sm border border-white/45 bg-white/5 px-2 py-1 text-center text-[0.4375rem] tracking-[0.08em] text-white/90 uppercase sm:max-w-[9rem] sm:px-3 sm:py-1.5 sm:text-[0.5rem]">
              Explore our menus
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-0.5 pb-2 sm:pb-3">
          <span className="text-[0.4375rem] tracking-[0.35em] text-white/50 uppercase sm:text-[0.5rem]">
            Scroll
          </span>
          <svg
            className="h-3 w-3 text-white/45 sm:h-3.5 sm:w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
