export const PRICING_CATEGORIES = [
  "websites",
  "aiAutomation",
  "seo",
  "booking",
] as const;

export type PricingCategory = (typeof PRICING_CATEGORIES)[number];

export const PLANS_BY_CATEGORY: Record<
  PricingCategory,
  readonly string[]
> = {
  websites: ["essential", "professional", "business"],
  aiAutomation: ["aiSolutions", "automation", "businessAutomation"],
  seo: ["foundation", "growth", "advanced"],
  booking: ["starter", "professional", "business"],
};

export const FEATURED_PLAN_BY_CATEGORY: Partial<
  Record<PricingCategory, string>
> = {
  websites: "professional",
};

export const PRICING_BUNDLE_KEYS = [
  "digitalPresence",
  "businessGrowth",
  "businessAutomation",
] as const;

export const PRICING_FAQ_KEYS = [
  "implementationVsMonthly",
  "vat",
  "singleService",
  "changePlan",
  "hosting",
  "externalCosts",
  "cancelMonthly",
  "customFeatures",
  "bookingExistingSite",
  "timeline",
] as const;