import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { buildLegalMetadata } from "@/lib/legal/metadata";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  return buildLegalMetadata("terms", "pt-PT");
}

export default async function TermsPage() {
  const t = await getTranslations("legal.nav");

  return (
    <LegalPageShell
      document="terms"
      locale="pt-PT"
      labels={{
        home: t("home"),
        language: t("switchLanguage"),
        alternateLanguage: t("alternateEn"),
      }}
    />
  );
}
