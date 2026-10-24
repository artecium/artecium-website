"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface ProjectCardCoverProps {
  coverVideo?: string;
  coverImage?: string;
  placeholderLabel: string;
}

export function ProjectCardCover({
  coverVideo,
  coverImage,
  placeholderLabel,
}: ProjectCardCoverProps) {
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
    if (!video || !coverVideo || reduceMotion) {
      return;
    }
    void video.play().catch(() => {
      // Autoplay may be blocked; first frame still visible with preload.
    });
  }, [coverVideo, reduceMotion]);

  if (coverVideo) {
    return (
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
        aria-hidden="true"
      />
    );
  }

  if (coverImage) {
    return (
      <Image
        src={coverImage}
        alt=""
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px"
      />
    );
  }

  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-3 border-b border-[#1E293B]/80 bg-gradient-to-br from-[#0E1324] to-[#050816] px-6 text-center"
      aria-hidden="true"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#1E293B] bg-[#050816] text-[#2563EB]">
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H5.25A2.25 2.25 0 003 5.25v13.5A2.25 2.25 0 005.25 21z"
          />
        </svg>
      </div>
      <span className="text-xs font-medium tracking-wide text-[#64748B] uppercase">
        {placeholderLabel}
      </span>
    </div>
  );
}
