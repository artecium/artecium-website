import type { AppLocale } from "@/i18n/config";
import type { PricingCategory } from "@/lib/pricing/config";
import { getCommercialPlan } from "@/lib/pricing/commercial-catalog";
import {
  formatCommercialMonthly,
  formatCommercialSetup,
} from "@/lib/pricing/format-commercial";

export type CommercialPlanDisplay = {
  planId: string;
  setup: string;
  monthly: string | null;
  hasNoMonthly: boolean;
  headline: string;
  subline: string | null;
};

export function getCommercialPlanDisplay(
  locale: AppLocale,
  category: PricingCategory,
  planKey: string,
): CommercialPlanDisplay {
  const plan = getCommercialPlan(category, planKey);
  const setup = formatCommercialSetup(locale, plan.setup);
  const monthly = formatCommercialMonthly(locale, plan.monthly);
  const hasNoMonthly = plan.monthly.kind === "none";

  let headline = setup;
  let subline: string | null = monthly;

  if (category === "seo" && (planKey === "growth" || planKey === "advanced")) {
    headline = monthly ?? setup;
    subline = setup;
  } else if (plan.setup.kind === "custom" && monthly) {
    headline = monthly;
    subline =
      locale === "en" ? "Custom initial setup" : "Configuração inicial personalizada";
  }

  return {
    planId: plan.id,
    setup,
    monthly,
    hasNoMonthly,
    headline,
    subline,
  };
}