import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { buildLegalMetadata } from "@/lib/legal/metadata";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  return buildLegalMetadata("cookies", "en");
}

export default async function CookiesPageEn() {
  const t = await getTranslations("legal.nav");

  return (
    <LegalPageShell
      document="cookies"
      locale="en"
      labels={{
        home: t("home"),
        language: t("switchLanguage"),
        alternateLanguage: t("alternatePt"),
      }}
    />
  );
}
