import type { AppLocale } from "@/i18n/config";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import {
  getServicePath,
  type ServicePageId,
} from "@/lib/services/paths";
import Link from "next/link";

const crossLinkServices: Record<
  ServicePageId,
  Array<{ id: ServicePageId; labelKey: "websites" | "ai" | "seo" }>
> = {
  websites: [
    { id: "ia", labelKey: "ai" },
    { id: "seo", labelKey: "seo" },
  ],
  ia: [
    { id: "websites", labelKey: "websites" },
    { id: "seo", labelKey: "seo" },
  ],
  seo: [
    { id: "websites", labelKey: "websites" },
    { id: "ia", labelKey: "ai" },
  ],
};

interface ServiceCrossLinksProps {
  locale: AppLocale;
  current: ServicePageId;
}

export async function ServiceCrossLinks({
  locale,
  current,
}: ServiceCrossLinksProps) {
  const t = await getTranslationsForLocale(locale, "services.shared");

  return (
    <section
      aria-labelledby={`${current}-cross-links-heading`}
      className="px-6 py-12 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-5xl">
        <h2
          id={`${current}-cross-links-heading`}
          className="text-sm font-medium tracking-widest text-[#64748B] uppercase"
        >
          {t("crossLinkTitle")}
        </h2>
        <ul className="mt-4 flex flex-wrap gap-4">
          {crossLinkServices[current].map((service) => (
            <li key={service.id}>
              <Link
                href={getServicePath(service.id, locale)}
                className="text-sm text-[#94A3B8] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
              >
                {t(`crossLinks.${service.labelKey}`)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
