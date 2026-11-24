import { AccountMenu } from "@/components/auth/AccountMenu";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { areaHubPath } from "@/lib/auth/entry-routes";
import type { AppLocale } from "@/i18n/config";
import type { PlatformProfile } from "@/types/platform";

interface PlatformHeaderProps {
  profile: PlatformProfile;
  areaLabel: string;
  locale: AppLocale;
}

export function PlatformHeader({
  profile,
  areaLabel,
  locale,
}: PlatformHeaderProps) {
  const hubLocale = locale === "en" ? "en" : "pt-PT";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-[#1E293B] bg-[#050816]/90 px-4 backdrop-blur-xl sm:px-6">
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-widest text-[#64748B]">
          {areaLabel}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <LanguageSwitcher currentLocale={locale} />
        <AccountMenu
          displayName={profile.full_name ?? ""}
          email={profile.email}
          workspacesHref={areaHubPath(hubLocale)}
          variant="header"
        />
      </div>
    </header>
  );
}
