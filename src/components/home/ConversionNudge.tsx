import { StartProjectButton } from "@/components/contact/StartProjectButton";
import Link from "next/link";

interface ConversionNudgeProps {
  message: string;
  ctaLabel: string;
  href?: string;
  useDiscovery?: boolean;
}

export function ConversionNudge({
  message,
  ctaLabel,
  href,
  useDiscovery = false,
}: ConversionNudgeProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-2xl border border-[#1E293B]/80 bg-[#0E1324]/40 px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
      <p className="text-sm leading-relaxed text-[#94A3B8] sm:text-base">
        {message}
      </p>
      {useDiscovery ? (
        <StartProjectButton variant="secondary" className="w-full shrink-0 sm:w-auto">
          {ctaLabel}
        </StartProjectButton>
      ) : (
        <Link
          href={href ?? "#contact"}
          className="inline-flex h-12 w-full shrink-0 items-center justify-center rounded-full border border-[#1E293B] bg-[#0E1324] px-6 text-sm font-medium text-white transition-all duration-300 hover:border-[#334155] hover:bg-[#0E1324]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 sm:w-auto"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
