import type {
  SubscriptionEntitlement,
  UsageSummary,
} from "@/types/platform";

/** Check if entitlements include a feature slug. */
export function hasFeature(
  entitlements: SubscriptionEntitlement[],
  featureSlug: string,
): boolean {
  return entitlements.some(
    (entry) => entry.feature_slug === featureSlug && entry.is_enabled,
  );
}

/** Get numeric limit for a feature across all entitlements (max if multiple). */
export function getFeatureLimit(
  entitlements: SubscriptionEntitlement[],
  featureSlug: string,
): number | null {
  const matches = entitlements.filter(
    (entry) =>
      entry.feature_slug === featureSlug &&
      entry.is_enabled &&
      entry.value_type === "numeric",
  );

  if (!matches.length) return null;

  const limits = matches
    .map((entry) => entry.limit_value)
    .filter((value): value is number => value !== null);

  return limits.length ? Math.max(...limits) : null;
}

/** Merge entitlements from multiple subscriptions (union by slug; limits take max). */
export function mergeEntitlements(
  groups: SubscriptionEntitlement[][],
): SubscriptionEntitlement[] {
  const map = new Map<string, SubscriptionEntitlement>();

  for (const group of groups) {
    for (const entry of group) {
      const existing = map.get(entry.feature_slug);
      if (!existing) {
        map.set(entry.feature_slug, entry);
        continue;
      }

      map.set(entry.feature_slug, {
        ...existing,
        is_enabled: existing.is_enabled || entry.is_enabled,
        limit_value:
          existing.value_type === "numeric" || entry.value_type === "numeric"
            ? Math.max(existing.limit_value ?? 0, entry.limit_value ?? 0) ||
              existing.limit_value ||
              entry.limit_value
            : existing.limit_value,
      });
    }
  }

  return [...map.values()].filter((entry) => entry.is_enabled);
}

/** Build usage summary for a numeric entitlement. */
export function buildUsageSummary(
  entitlement: SubscriptionEntitlement,
  used: number,
  periodStart: string,
  periodEnd: string,
): UsageSummary | null {
  if (entitlement.value_type !== "numeric") return null;

  const limit = entitlement.limit_value;
  const remaining =
    limit !== null ? Math.max(limit - used, 0) : null;

  return {
    feature_slug: entitlement.feature_slug,
    feature_name: entitlement.feature_name,
    unit: entitlement.limit_unit ?? "units",
    limit,
    used,
    remaining,
    period_start: periodStart,
    period_end: periodEnd,
  };
}

/** Support channel access derived from entitlements (server-side checks). */
export function getSupportChannels(
  entitlements: SubscriptionEntitlement[],
): ("email" | "priority" | "whatsapp" | "phone")[] {
  const channels: ("email" | "priority" | "whatsapp" | "phone")[] = [];

  if (hasFeature(entitlements, "email_support")) channels.push("email");
  if (hasFeature(entitlements, "priority_support")) channels.push("priority");
  if (hasFeature(entitlements, "whatsapp_support")) channels.push("whatsapp");
  if (hasFeature(entitlements, "phone_support")) channels.push("phone");

  return channels;
}

/** Analytics access requires integration + entitlement. */
export function canAccessAnalytics(
  entitlements: SubscriptionEntitlement[],
  hasActiveConnection: boolean,
): boolean {
  return hasActiveConnection && hasFeature(entitlements, "analytics_access");
}

/** SEO access requires integration + entitlement. */
export function canAccessSeo(
  entitlements: SubscriptionEntitlement[],
  hasActiveConnection: boolean,
): boolean {
  return hasActiveConnection && hasFeature(entitlements, "seo_access");
}
