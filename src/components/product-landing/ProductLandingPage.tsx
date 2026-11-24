import { ServicePageShell } from "@/components/services/ServicePageShell";
import { ProductLandingStructuredData } from "@/components/product-landing/ProductLandingStructuredData";
import { marketing } from "@/lib/ui/marketing-classes";
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

const btnPrimary =
  "inline-flex h-11 items-center justify-center rounded-md bg-accent px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

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
      <div className={`border-b ${marketing.sectionDivider}`}>
        <div className={`mx-auto max-w-4xl ${marketing.section}`}>
          <p className={marketing.eyebrow}>{eyebrow}</p>
          <h1 className={`mt-4 ${marketing.titleLg}`}>{h1}</h1>
          <p className={`mt-6 ${marketing.body}`}>{intro}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            {primaryCta.external ? (
              <a href={primaryCta.href} className={btnPrimary} rel="noopener noreferrer">
                {primaryCta.label}
              </a>
            ) : (
              <Link href={primaryCta.href} className={btnPrimary}>
                {primaryCta.label}
              </Link>
            )}
            {secondaryCta ? (
              <a
                href={secondaryCta.href}
                rel="noopener noreferrer"
                className={marketing.btnSecondary}
              >
                {secondaryCta.label}
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div className={`mx-auto max-w-4xl ${marketing.section}`}>
        <h2 className={marketing.titleMd}>
          {locale === "en" ? "What you get" : "O que inclui"}
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <li key={feature.title} className={marketing.card}>
              <h3 className="text-base font-medium text-foreground">{feature.title}</h3>
              <p className={`mt-2 ${marketing.bodySm}`}>{feature.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </ServicePageShell>
  );
}