import { SignOutButton } from "@/components/auth/SignOutButton";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
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
  const roleLabel = profile.roles
    .map((role) => role.replace(/_/g, " "))
    .join(", ");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#1E293B] bg-[#050816]/90 px-4 backdrop-blur-xl sm:px-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-[#64748B]">
          {areaLabel}
        </p>
        <p className="text-sm font-medium text-white">
          {profile.full_name ?? profile.email}
        </p>
        {roleLabel ? (
          <p className="text-xs capitalize text-[#64748B]">{roleLabel}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <LanguageSwitcher currentLocale={locale} />
        <SignOutButton />
      </div>
    </header>
  );
}
