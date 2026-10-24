import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { buildLegalMetadata } from "@/lib/legal/metadata";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  return buildLegalMetadata("terms", "en");
}

export default async function TermsPageEn() {
  const t = await getTranslations("legal.nav");

  return (
    <LegalPageShell
      document="terms"
      locale="en"
      labels={{
        home: t("home"),
        language: t("switchLanguage"),
        alternateLanguage: t("alternatePt"),
      }}
    />
  );
}
