import type { ReactNode } from "react";

export default function BookingPublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-[#050816] text-white">
      <div className="mx-auto max-w-lg px-4 py-8 sm:max-w-2xl sm:py-12">{children}</div>
    </div>
  );
}
