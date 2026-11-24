import { getTranslations } from "next-intl/server";

import { WhyStackClient, type WhyStackCardContent } from "@/components/home/WhyStackClient";

const cardKeys = ["noTech", "tailored", "directComms", "modernTech", "readyToGrow"] as const;

export async function WhyStack() {
  const t = await getTranslations("home.why");

  const total = String(cardKeys.length).padStart(2, "0");

  const cards: WhyStackCardContent[] = cardKeys.map((key, index) => ({
    index,
    number: String(index + 1).padStart(2, "0"),
    total,
    title: t(`items.${key}.title`),
    description: t(`items.${key}.description`),
  }));

  return (
    <WhyStackClient
      eyebrow={t("eyebrow")}
      title={t("title")}
      cards={cards}
      titleId="about-heading"
    />
  );
}
