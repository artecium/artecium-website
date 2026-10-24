import { SectionHeader } from "@/components/ui/SectionHeader";
import { resolveRequestLocale } from "@/lib/i18n/resolve-locale";
import { getServicePath, type ServicePageId } from "@/lib/services/paths";
import Link from "next/link";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";

const primaryServiceKeys = ["websites", "aiAutomation", "seo"] as const;

const primaryServicePaths: Record<
  (typeof primaryServiceKeys)[number],
  ServicePageId
> = {
  websites: "websites",
  aiAutomation: "ia",
  seo: "seo",
};

type PrimaryServiceKey = (typeof primaryServiceKeys)[number];

const serviceIcons: Record<PrimaryServiceKey, React.ReactNode> = {
  websites: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  ),
  aiAutomation: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.5 15.3l-1.57-1.57a2.25 2.25 0 00-1.59-.659H9.75m9.75 0v2.25a2.25 2.25 0 01-2.25 2.25H5.25a2.25 2.25 0 01-2.25-2.25V15.3" />
    </svg>
  ),
  seo: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
    </svg>
  ),
};

function ServiceCard({
  serviceKey,
  title,
  forWho,
  includes,
  description,
  ctaLabel,
  href,
}: {
  serviceKey: PrimaryServiceKey;
  title: string;
  forWho?: string;
  includes?: string;
  description: string;
  ctaLabel?: string;
  href?: string;
}) {
  const className =
    "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#2563EB]/30 bg-[#0E1324] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#2563EB]/50 hover:shadow-[0_8px_40px_rgba(37,99,235,0.1)]";

  const content = (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/0 to-[#2563EB]/0 transition-all duration-300 group-hover:from-[#2563EB]/5 group-hover:to-transparent" />
      <div className="relative flex flex-1 flex-col">
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#1E293B] bg-[#050816] text-[#2563EB] transition-all duration-300 group-hover:border-[#2563EB]/30 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.15)]">
          {serviceIcons[serviceKey]}
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {forWho ? (
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[#64748B]">
            {forWho}
          </p>
        ) : null}
        <p className="mt-3 flex-1 text-sm leading-relaxed text-[#94A3B8]">
          {description}
        </p>
        {includes ? (
          <p className="mt-3 text-sm text-[#64748B]">{includes}</p>
        ) : null}
        {ctaLabel && href ? (
          <span className="mt-5 inline-flex text-sm font-medium text-[#60A5FA] transition-colors group-hover:text-white">
            {ctaLabel} →
          </span>
        ) : null}
      </div>
    </>
  );

  return (
    <Link
      href={href!}
      className={`${className} block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50`}
    >
      {content}
    </Link>
  );
}

export async function Services() {
  const locale = await resolveRequestLocale();
  const t = await getTranslationsForLocale(locale, "home.services");

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="px-6 py-24 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          titleId="services-heading"
        />

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {primaryServiceKeys.map((key) => (
            <ServiceCard
              key={key}
              serviceKey={key}
              title={t(`${key}.title`)}
              forWho={t(`${key}.forWho`)}
              includes={t(`${key}.includes`)}
              description={t(`${key}.description`)}
              ctaLabel={t(`${key}.cta`)}
              href={getServicePath(primaryServicePaths[key], locale)}
            />
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-3xl text-center text-sm leading-relaxed text-[#64748B]">
          {t("complementarySummary")}
        </p>
      </div>
    </section>
  );
}
