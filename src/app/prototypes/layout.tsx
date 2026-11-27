import { LabBanner } from "@/lib/lab/LabBanner";
import { LabConfigError } from "@/lib/lab/LabConfigError";
import { LabGuardError, assertLabRuntimeEnvironment } from "@/lib/lab/guards";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function PrototypesLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  let guardMessage: string | null = null;
  try {
    assertLabRuntimeEnvironment();
  } catch (error) {
    if (error instanceof LabGuardError) {
      guardMessage = error.message;
    } else {
      guardMessage = "Falha de segurança do Artecium Lab.";
    }
  }

  if (guardMessage) {
    return (
      <div className="min-h-dvh bg-[#0c0c0c] text-[#f5f0e8]">
        <LabBanner />
        <LabConfigError message={guardMessage} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0c0c0c] text-[#f5f0e8]">
      <LabBanner />
      {children}
    </div>
  );
}