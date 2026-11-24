import { ArteciumLogo } from "@/components/ArteciumLogo";
import type { ReactNode } from "react";

/** Minimal hero visual — no glow/orbit effects. */
export function HeroVisual() {
  return (
    <div
      className="flex aspect-[5/4] w-full max-w-md items-center justify-center rounded-xl border border-border bg-surface lg:max-w-none"
      aria-hidden
    >
      <MotionlessFrame>
        <ArteciumLogo className="h-20 w-20 opacity-95 sm:h-24 sm:w-24" />
      </MotionlessFrame>
    </div>
  );
}

function MotionlessFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 px-8">
      {children}
      <div className="h-px w-16 bg-border" />
      <p className="text-center text-xs font-medium tracking-[0.25em] text-muted-subtle">
        ARTECIUM
      </p>
    </div>
  );
}