import { AccountMenu } from "@/components/auth/AccountMenu";
import { AreaHub } from "@/components/auth/AreaHub";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { areaHubPath } from "@/lib/auth/entry-routes";
import { getUserAreaAccess } from "@/lib/auth/area-access.server";
import { requireAuth } from "@/lib/auth/session";
import { constructMetadata } from "@/lib/seo/metadata";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslationsForLocale("en", "metadata");

  return constructMetadata({
    title: t("areaHubTitle"),
    description: t("areaHubDescription"),
    path: "/en/acesso",
    noIndex: true,
  });
}

interface AcessoPageEnProps {
  searchParams: Promise<{ reason?: string }>;
}

function parseReason(raw: string | undefined): "clientDenied" | "bookingDenied" | null {
  if (raw === "clientDenied" || raw === "bookingDenied") return raw;
  return null;
}

export default async function AcessoPageEn({ searchParams }: AcessoPageEnProps) {
  const { reason: reasonParam } = await searchParams;
  const session = await requireAuth("/login?next=%2Fen%2Facesso");
  const access = await getUserAreaAccess();

  return (
    <>
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 sm:right-6 sm:top-6">
        <LanguageSwitcher currentLocale="en" />
        <AccountMenu
          displayName={session.profile.full_name ?? ""}
          email={session.profile.email}
          workspacesHref={areaHubPath("en")}
          variant="standalone"
        />
      </div>
      <AreaHub
        access={access}
        reason={parseReason(reasonParam)}
        homeHref="/en"
        displayName={session.profile.full_name ?? session.profile.email}
      />
    </>
  );
}
