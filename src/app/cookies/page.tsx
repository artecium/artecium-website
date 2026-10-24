import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { buildLegalMetadata } from "@/lib/legal/metadata";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  return buildLegalMetadata("cookies", "pt-PT");
}

export default async function CookiesPage() {
  const t = await getTranslations("legal.nav");

  return (
    <LegalPageShell
      document="cookies"
      locale="pt-PT"
      labels={{
        home: t("home"),
        language: t("switchLanguage"),
        alternateLanguage: t("alternateEn"),
      }}
    />
  );
}
