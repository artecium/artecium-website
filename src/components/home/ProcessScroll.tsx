import { getTranslations } from "next-intl/server";

import { ProcessScrollClient, type ProcessScrollStep } from "@/components/home/ProcessScrollClient";

const stepKeys = ["discovery", "strategy", "build", "launch"] as const;

export async function ProcessScroll() {
  const t = await getTranslations("home.process");

  const steps: ProcessScrollStep[] = stepKeys.map((key, index) => ({
    number: String(index + 1).padStart(2, "0"),
    title: t(`steps.${key}.title`),
    description: t(`steps.${key}.description`),
  }));

  return (
    <ProcessScrollClient
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      titleId="process-heading"
      steps={steps}
    />
  );
}
