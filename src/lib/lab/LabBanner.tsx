import { getArteciumRuntime } from "@/lib/lab/runtime";
import Link from "next/link";

export function LabBanner() {
  const runtime = getArteciumRuntime();
  const label =
    runtime === "prototype"
      ? "ARTECIUM LAB — PROTOTYPE"
      : runtime === "staging"
        ? "ARTECIUM LAB — STAGING"
        : "ARTECIUM LAB";

  return (
    <header className="sticky top-0 z-[100] border-b border-amber-500/25 bg-[#1a1408]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
          <p className="text-[10px] font-semibold tracking-[0.22em] text-amber-400 uppercase">
            {label}
          </p>
          <p className="text-xs text-amber-100/70">
            Dados fictícios · sem reservas reais · sem pagamentos
          </p>
        </div>
        <Link
          href="/prototypes"
          className="text-xs font-medium text-amber-200/90 underline-offset-2 hover:text-amber-100 hover:underline"
        >
          Índice do Lab
        </Link>
      </div>
    </header>
  );
}