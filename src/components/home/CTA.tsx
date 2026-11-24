"use client";

import { StartProjectButton } from "@/components/contact/StartProjectButton";
import { marketing } from "@/lib/ui/marketing-classes";
import { useTranslations } from "next-intl";

export function CTA() {
  const t = useTranslations("home.cta");

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className={`${marketing.section} ${marketing.sectionDivider}`}
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 id="contact-heading" className={marketing.titleLg}>
          {t("title")}
        </h2>

        <p className={`mx-auto mt-5 max-w-xl ${marketing.body}`}>{t("description")}</p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <div className="flex w-full flex-col gap-2 sm:w-auto">
            <StartProjectButton className="w-full sm:w-auto">{t("startProject")}</StartProjectButton>
            <p className={marketing.caption}>{t("ctaMicrocopy")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}