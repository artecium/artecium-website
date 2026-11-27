import {
  PLANS_BY_CATEGORY,
  PRICING_CATEGORIES,
  type PricingCategory,
} from "@/lib/pricing/config";

export const COMMERCIAL_CATALOG_VERSION = "2026-03-26" as const;

export type CommercialAmount =
  | { kind: "fixed"; eur: number }
  | { kind: "from"; eur: number }
  | { kind: "included" }
  | { kind: "custom" }
  | { kind: "none" };

export type CommercialPlanDefinition = {
  /** Stable id, e.g. `websites.essential` */
  id: string;
  category: PricingCategory;
  planKey: string;
  setup: CommercialAmount;
  monthly: CommercialAmount;
};

function planId(category: PricingCategory, planKey: string): string {
  return `${category}.${planKey}`;
}

const WEBSITE_PLANS: CommercialPlanDefinition[] = [
  {
    id: planId("websites", "essential"),
    category: "websites",
    planKey: "essential",
    setup: { kind: "fixed", eur: 750 },
    monthly: { kind: "fixed", eur: 29 },
  },
  {
    id: planId("websites", "professional"),
    category: "websites",
    planKey: "professional",
    setup: { kind: "fixed", eur: 1500 },
    monthly: { kind: "fixed", eur: 49 },
  },
  {
    id: planId("websites", "business"),
    category: "websites",
    planKey: "business",
    setup: { kind: "from", eur: 2500 },
    monthly: { kind: "from", eur: 89 },
  },
];

const AI_PLANS: CommercialPlanDefinition[] = [
  {
    id: planId("aiAutomation", "aiSolutions"),
    category: "aiAutomation",
    planKey: "aiSolutions",
    setup: { kind: "from", eur: 750 },
    monthly: { kind: "fixed", eur: 49 },
  },
  {
    id: planId("aiAutomation", "automation"),
    category: "aiAutomation",
    planKey: "automation",
    setup: { kind: "from", eur: 1500 },
    monthly: { kind: "fixed", eur: 99 },
  },
  {
    id: planId("aiAutomation", "businessAutomation"),
    category: "aiAutomation",
    planKey: "businessAutomation",
    setup: { kind: "custom" },
    monthly: { kind: "from", eur: 199 },
  },
];

const SEO_PLANS: CommercialPlanDefinition[] = [
  {
    id: planId("seo", "foundation"),
    category: "seo",
    planKey: "foundation",
    setup: { kind: "fixed", eur: 350 },
    monthly: { kind: "none" },
  },
  {
    id: planId("seo", "growth"),
    category: "seo",
    planKey: "growth",
    setup: { kind: "included" },
    monthly: { kind: "fixed", eur: 400 },
  },
  {
    id: planId("seo", "advanced"),
    category: "seo",
    planKey: "advanced",
    setup: { kind: "included" },
    monthly: { kind: "fixed", eur: 750 },
  },
];

const BOOKING_PLANS: CommercialPlanDefinition[] = [
  {
    id: planId("booking", "starter"),
    category: "booking",
    planKey: "starter",
    setup: { kind: "fixed", eur: 150 },
    monthly: { kind: "fixed", eur: 19 },
  },
  {
    id: planId("booking", "professional"),
    category: "booking",
    planKey: "professional",
    setup: { kind: "fixed", eur: 300 },
    monthly: { kind: "fixed", eur: 39 },
  },
  {
    id: planId("booking", "business"),
    category: "booking",
    planKey: "business",
    setup: { kind: "custom" },
    monthly: { kind: "fixed", eur: 69 },
  },
];

export const COMMERCIAL_CATALOG: readonly CommercialPlanDefinition[] = [
  ...WEBSITE_PLANS,
  ...AI_PLANS,
  ...SEO_PLANS,
  ...BOOKING_PLANS,
];

export const COMMERCIAL_CATALOG_BY_ID: Record<string, CommercialPlanDefinition> =
  Object.fromEntries(COMMERCIAL_CATALOG.map((plan) => [plan.id, plan]));

export function getCommercialPlan(
  category: PricingCategory,
  planKey: string,
): CommercialPlanDefinition {
  const id = planId(category, planKey);
  const plan = COMMERCIAL_CATALOG_BY_ID[id];
  if (!plan) {
    throw new Error(`Unknown commercial plan: ${id}`);
  }
  return plan;
}

export function listCommercialPlans(category: PricingCategory): CommercialPlanDefinition[] {
  return PLANS_BY_CATEGORY[category].map((planKey) =>
    getCommercialPlan(category, planKey),
  );
}

export const PRICING_CATEGORY_LABELS = PRICING_CATEGORIES;

/** Web applications — outside the four-tab catalog; marketing reference only. */
export const WEB_APPLICATION_SETUP_FROM_EUR = 3500;