import { SignOutButton } from "@/components/auth/SignOutButton";
import type { PlatformProfile } from "@/types/platform";

interface PlatformHeaderProps {
  profile: PlatformProfile;
  areaLabel: string;
}

export function PlatformHeader({ profile, areaLabel }: PlatformHeaderProps) {
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
      <SignOutButton />
    </header>
  );
}
