import { AccountMenu } from "@/components/auth/AccountMenu";
import { AreaHub } from "@/components/auth/AreaHub";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { areaHubPath } from "@/lib/auth/entry-routes";
import { getUserAreaAccess } from "@/lib/auth/area-access.server";
import { requireAuth } from "@/lib/auth/session";
import { resolveLocale } from "@/i18n/config";
import { constructMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");

  return constructMetadata({
    title: t("areaHubTitle"),
    description: t("areaHubDescription"),
    path: "/acesso",
    noIndex: true,
  });
}

interface AcessoPageProps {
  searchParams: Promise<{ reason?: string }>;
}

function parseReason(raw: string | undefined): "clientDenied" | "bookingDenied" | null {
  if (raw === "clientDenied" || raw === "bookingDenied") return raw;
  return null;
}

export default async function AcessoPage({ searchParams }: AcessoPageProps) {
  const { reason: reasonParam } = await searchParams;
  const session = await requireAuth("/login?next=%2Facesso");
  const access = await getUserAreaAccess();
  const locale = resolveLocale(await getLocale());

  return (
    <>
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 sm:right-6 sm:top-6">
        <LanguageSwitcher currentLocale={locale} />
        <AccountMenu
          displayName={session.profile.full_name ?? ""}
          email={session.profile.email}
          workspacesHref={areaHubPath("pt-PT")}
          variant="standalone"
        />
      </div>
      <AreaHub
        access={access}
        reason={parseReason(reasonParam)}
        homeHref={locale === "en" ? "/en" : "/"}
      />
    </>
  );
}
