import { getTranslations } from "next-intl/server";

import { ChallengesListClient, type ChallengeItem } from "@/components/home/ChallengesListClient";

const challengeKeys = ["outdatedWebsite", "fewLeads", "manualProcesses", "scatteredInfo"] as const;

export async function ChallengesList() {
  const t = await getTranslations("home.problems");

  const items: ChallengeItem[] = challengeKeys.map((key, index) => ({
    number: String(index + 1).padStart(2, "0"),
    title: t(`items.${key}.title`),
    description: t(`items.${key}.description`),
  }));

  return (
    <ChallengesListClient
      eyebrow={t("eyebrow")}
      title={t("title")}
      items={items}
      closingLead={t("closing.lead")}
      closingRest={t("closing.rest")}
      titleId="problems-heading"
    />
  );
}
