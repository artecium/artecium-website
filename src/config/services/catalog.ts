/** Stable feature slugs — single source of truth for entitlement checks. */

export const FEATURE_SLUGS = {
  SECURITY_UPDATES: "security_updates",
  AUTOMATIC_BACKUPS: "automatic_backups",
  UPTIME_MONITORING: "uptime_monitoring",
  BUG_FIXES: "bug_fixes",
  EMAIL_SUPPORT: "email_support",
  MONTHLY_CHANGES_MINUTES: "monthly_changes_minutes",
  BASIC_SEO: "basic_seo",
  MONTHLY_REPORTS: "monthly_reports",
  ADVANCED_MONITORING: "advanced_monitoring",
  PRIORITY_SUPPORT: "priority_support",
  CONTENT_MANAGEMENT_PAGES: "content_management_pages",
  NEW_PAGES_FEATURES: "new_pages_features",
  ADVANCED_SEO: "advanced_seo",
  ADVANCED_REPORTS: "advanced_reports",
  WHATSAPP_SUPPORT: "whatsapp_support",
  PHONE_SUPPORT: "phone_support",
  DIGITAL_CONSULTING: "digital_consulting",
  DEVELOPMENT_DISCOUNTS: "development_discounts",
  ANALYTICS_ACCESS: "analytics_access",
  SEO_ACCESS: "seo_access",
} as const;

export type FeatureSlug = (typeof FEATURE_SLUGS)[keyof typeof FEATURE_SLUGS];

export const SERVICE_SLUGS = {
  WEBSITE: "website",
  SOFTWARE: "software",
  AI_AUTOMATION: "ai-automation",
  SEO: "seo",
  ANALYTICS: "analytics",
  CONSULTING: "consulting",
  CUSTOM_DEVELOPMENT: "custom-development",
  MAINTENANCE: "maintenance",
} as const;

export type ServiceSlug = (typeof SERVICE_SLUGS)[keyof typeof SERVICE_SLUGS];

export const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "paused",
  "cancelled",
  "expired",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const BILLING_PERIODS = [
  "monthly",
  "quarterly",
  "yearly",
  "one_time",
] as const;

export type BillingPeriod = (typeof BILLING_PERIODS)[number];

export const PROJECT_STATUS_SLUGS = [
  "analysis",
  "development",
  "review",
  "live",
  "maintenance",
  "paused",
  "completed",
  "cancelled",
] as const;

export type ProjectStatusSlug = (typeof PROJECT_STATUS_SLUGS)[number];
