import { ServicePageShell } from "@/components/services/ServicePageShell";
import { ProductLandingStructuredData } from "@/components/product-landing/ProductLandingStructuredData";
import type { AppLocale } from "@/i18n/config";
import Link from "next/link";

export interface ProductLandingFeature {
  title: string;
  description: string;
}

interface ProductLandingPageProps {
  locale: AppLocale;
  path: string;
  structuredName: string;
  structuredDescription: string;
  eyebrow: string;
  h1: string;
  intro: string;
  features: ProductLandingFeature[];
  primaryCta: { href: string; label: string; external?: boolean };
  secondaryCta?: { href: string; label: string; external?: boolean };
}

function CtaLink({
  href,
  label,
  external,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  const className =
    "inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50";

  if (external) {
    return (
      <a
        href={href}
        className={`${className} border border-[#2563EB]/40 bg-[#2563EB] text-white hover:bg-[#1D4ED8]`}
        rel="noopener noreferrer"
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={`${className} border border-[#2563EB]/40 bg-[#2563EB] text-white hover:bg-[#1D4ED8]`}
    >
      {label}
    </Link>
  );
}

export function ProductLandingPage({
  locale,
  path,
  structuredName,
  structuredDescription,
  eyebrow,
  h1,
  intro,
  features,
  primaryCta,
  secondaryCta,
}: ProductLandingPageProps) {
  return (
    <ServicePageShell locale={locale}>
      <ProductLandingStructuredData
        locale={locale}
        path={path}
        name={structuredName}
        description={structuredDescription}
      />
      <div className="relative border-b border-[#1E293B]/60">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div className="absolute left-1/2 top-0 h-[320px] w-[640px] -translate-x-1/2 rounded-full bg-[#2563EB]/[0.06] blur-[100px]" />
        </div>
        <div className="mx-auto max-w-4xl px-6 py-16 sm:px-10 sm:py-24 lg:px-16">
          <p className="text-sm font-medium tracking-widest text-[#2563EB] uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {h1}
          </h1>
          <p className="mt-6 text-base leading-relaxed text-[#94A3B8] sm:text-lg">
            {intro}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <CtaLink {...primaryCta} />
            {secondaryCta ? (
              <a
                href={secondaryCta.href}
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#1E293B] bg-[#0E1324] px-6 text-sm font-medium text-white transition-all duration-300 hover:border-[#2563EB]/40 hover:bg-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
              >
                {secondaryCta.label}
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-6 py-16 sm:px-10 lg:px-16">
        <h2 className="text-xl font-semibold text-white sm:text-2xl">
          {locale === "en" ? "What you get" : "O que inclui"}
        </h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="rounded-2xl border border-[#1E293B] bg-[#0E1324]/80 p-6"
            >
              <h3 className="text-base font-medium text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </ServicePageShell>
  );
}