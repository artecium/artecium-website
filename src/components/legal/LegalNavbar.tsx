import { ArteciumLogo } from "@/components/ArteciumLogo";
import type { AppLocale } from "@/i18n/config";
import type { LegalDocumentId } from "@/content/legal/types";
import { getAlternateLegalPath } from "@/lib/legal/paths";
import Link from "next/link";

interface LegalNavbarProps {
  locale: AppLocale;
  document: LegalDocumentId;
  homeLabel: string;
  languageLabel: string;
  alternateLanguageLabel: string;
}

export function LegalNavbar({
  locale,
  document,
  homeLabel,
  languageLabel,
  alternateLanguageLabel,
}: LegalNavbarProps) {
  const alternateHref = getAlternateLegalPath(document, locale);

  return (
    <header className="sticky top-0 z-50 border-b border-[#1E293B]/60 bg-[#050816]/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6 sm:px-10">
        <Link href="/" className="group flex items-center gap-3">
          <ArteciumLogo
            className="h-8 w-8 transition-transform duration-300 group-hover:scale-105 sm:h-9 sm:w-9"
          />
          <span className="text-sm font-semibold tracking-[0.2em] text-white">ARTECIUM</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href={alternateHref}
            className="rounded-full border border-[#1E293B] px-3 py-1.5 text-xs font-medium text-[#94A3B8] transition-colors hover:border-[#334155] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
            aria-label={languageLabel}
          >
            {alternateLanguageLabel}
          </Link>
          <Link
            href="/"
            className="text-sm text-[#94A3B8] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
          >
            {homeLabel}
          </Link>
        </div>
      </nav>
    </header>
  );
}
