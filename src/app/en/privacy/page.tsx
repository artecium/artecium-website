import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { buildLegalMetadata } from "@/lib/legal/metadata";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  return buildLegalMetadata("privacy", "en");
}

export default async function PrivacyPageEn() {
  const t = await getTranslations("legal.nav");

  return (
    <LegalPageShell
      document="privacy"
      locale="en"
      labels={{
        home: t("home"),
        language: t("switchLanguage"),
        alternateLanguage: t("alternatePt"),
      }}
    />
  );
}
