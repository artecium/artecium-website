import {
  buildUsageSummary,
  mergeEntitlements,
} from "@/lib/services/entitlements";
import {
  logDataQueryError,
  skippedFetchResult,
} from "@/lib/data/supabase-query";
import { createClient } from "@/lib/supabase/server";
import { FEATURE_SLUGS } from "@/config/services/catalog";
import type {
  ClientServiceOverview,
  ClientSubscription,
  Service,
  SubscriptionEntitlement,
  UsageSummary,
} from "@/types/platform";

export async function getServicesSchemaState(
  companyIds: string[] = [],
): Promise<{
  configured: boolean;
  message: string;
  migration: "001" | "002" | "none";
}> {
  const supabase = await createClient();

  const { error: profilesError } = await supabase
    .from("profiles")
    .select("id")
    .limit(1);

  if (profilesError) {
    return {
      configured: false,
      migration: "none",
      message:
        "A base de dados ainda não está configurada. Execute supabase/migrations/001_initial_schema.sql.",
    };
  }

  if (companyIds.length) {
    const { data, error } = await supabase
      .from("client_subscriptions")
      .select("id")
      .in("company_id", companyIds)
      .in("status", ["trialing", "active", "past_due"])
      .limit(1);

    if (!error && data?.length) {
      return { configured: true, migration: "002", message: "" };
    }
  }

  const { error: servicesError } = await supabase
    .from("services")
    .select("id")
    .limit(1);

  if (!servicesError) {
    return { configured: true, migration: "002", message: "" };
  }

  const message = servicesError.message ?? "";
  const missingTable =
    servicesError.code === "42P01" ||
    message.includes("does not exist") ||
    message.includes("Could not find the table");

  if (missingTable) {
    return {
      configured: false,
      migration: "002",
      message:
        "Execute também supabase/migrations/002_services_plans_subscriptions.sql para ativar serviços, planos e subscrições.",
    };
  }

  return { configured: true, migration: "002", message: "" };
}

function mapSubscription(row: Record<string, unknown>): ClientSubscription {
  const services = row.services as Record<string, unknown> | null;
  const servicePlans = row.service_plans as Record<string, unknown> | null;

  return {
    id: row.id as string,
    company_id: row.company_id as string,
    service_id: row.service_id as string,
    service_plan_id: (row.service_plan_id as string | null) ?? null,
    status: row.status as ClientSubscription["status"],
    price: row.price !== null ? Number(row.price) : null,
    currency: row.currency as ClientSubscription["currency"],
    billing_period: row.billing_period as ClientSubscription["billing_period"],
    started_at: row.started_at as string,
    current_period_start: (row.current_period_start as string | null) ?? null,
    current_period_end: (row.current_period_end as string | null) ?? null,
    cancelled_at: (row.cancelled_at as string | null) ?? null,
    config: (row.config as Record<string, unknown>) ?? {},
    service: services
      ? {
          id: row.service_id as string,
          slug: services.slug as string,
          name: services.name as string,
          category: (services.category as string) ?? "",
          description: (services.description as string | null) ?? null,
          has_plans: Boolean(services.has_plans),
          billing_model: (services.billing_model as Service["billing_model"]) ?? "custom",
          is_active: Boolean(services.is_active ?? true),
          sort_order: Number(services.sort_order ?? 0),
        }
      : undefined,
    plan: servicePlans
      ? {
          id: row.service_plan_id as string,
          service_id: row.service_id as string,
          slug: servicePlans.slug as string,
          name: servicePlans.name as string,
          description: null,
          price:
            servicePlans.price !== null && servicePlans.price !== undefined
              ? Number(servicePlans.price)
              : null,
          currency: row.currency as ClientSubscription["currency"],
          billing_period:
            row.billing_period as ClientSubscription["billing_period"],
          parent_plan_id: null,
          is_active: true,
          sort_order: 0,
        }
      : undefined,
  };
}

async function attachServicePlans(
  supabase: Awaited<ReturnType<typeof createClient>>,
  subscriptions: ClientSubscription[],
): Promise<ClientSubscription[]> {
  const planIds = [
    ...new Set(
      subscriptions
        .map((subscription) => subscription.service_plan_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  if (!planIds.length) return subscriptions;

  const { data: plans, error } = await supabase
    .from("service_plans")
    .select("id, slug, name, price")
    .in("id", planIds);

  if (error) {
    logDataQueryError("client-subscriptions.attachServicePlans", error);
    return subscriptions;
  }

  const planById = new Map((plans ?? []).map((plan) => [plan.id as string, plan]));

  return subscriptions.map((subscription) => {
    if (!subscription.service_plan_id || subscription.plan) {
      return subscription;
    }

    const planRow = planById.get(subscription.service_plan_id);
    if (!planRow) return subscription;

    return {
      ...subscription,
      plan: {
        id: subscription.service_plan_id,
        service_id: subscription.service_id,
        slug: planRow.slug as string,
        name: planRow.name as string,
        description: null,
        price:
          planRow.price !== null && planRow.price !== undefined
            ? Number(planRow.price)
            : null,
        currency: subscription.currency,
        billing_period: subscription.billing_period,
        parent_plan_id: null,
        is_active: true,
        sort_order: 0,
      },
    };
  });
}

export async function getClientSubscriptions(
  companyIds: string[],
): Promise<ClientSubscription[]> {
  if (!companyIds.length) {
    skippedFetchResult([], "getClientSubscriptions requires companyIds");
    return [];
  }

  const schema = await getServicesSchemaState(companyIds);
  if (!schema.configured) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_subscriptions")
    .select(
      `
      *,
      services ( slug, name, category, description, has_plans, billing_model, is_active, sort_order )
    `,
    )
    .in("company_id", companyIds)
    .in("status", ["trialing", "active", "past_due"])
    .order("created_at", { ascending: false });

  if (error) {
    logDataQueryError("client-subscriptions.getClientSubscriptions", error);
    return [];
  }

  if (!data?.length) return [];

  const subscriptions = data.map((row) => mapSubscription(row as Record<string, unknown>));
  return attachServicePlans(supabase, subscriptions);
}

export async function getSubscriptionEntitlements(
  subscriptionId: string,
): Promise<SubscriptionEntitlement[]> {
  const schema = await getServicesSchemaState();
  if (!schema.configured) return [];

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_subscription_entitlements", {
    p_subscription_id: subscriptionId,
  });

  if (error || !data) {
    if (error) {
      logDataQueryError("client-subscriptions.getSubscriptionEntitlements.rpc", error);
    }

    const { data: cached, error: cachedError } = await supabase
      .from("subscription_entitlements")
      .select("*")
      .eq("subscription_id", subscriptionId);

    if (cachedError) {
      logDataQueryError("client-subscriptions.getSubscriptionEntitlements.cache", cachedError);
    }

    if (!cached?.length) return [];

    return cached.map((row) => ({
      feature_id: row.feature_id,
      feature_slug: row.feature_slug,
      feature_name: row.feature_slug,
      value_type: row.limit_value !== null ? "numeric" : "boolean",
      is_enabled: row.is_enabled,
      limit_value: row.limit_value !== null ? Number(row.limit_value) : null,
      limit_unit: row.limit_unit,
      source: row.source as SubscriptionEntitlement["source"],
    }));
  }

  return (data as Record<string, unknown>[]).map((row) => ({
    feature_id: row.feature_id as string,
    feature_slug: row.feature_slug as string,
    feature_name: row.feature_name as string,
    value_type: row.value_type as SubscriptionEntitlement["value_type"],
    is_enabled: Boolean(row.is_enabled),
    limit_value:
      row.limit_value !== null && row.limit_value !== undefined
        ? Number(row.limit_value)
        : null,
    limit_unit: (row.limit_unit as string | null) ?? null,
    source: row.source as SubscriptionEntitlement["source"],
  }));
}

async function getUsageForSubscription(
  subscriptionId: string,
  featureSlug: string,
  periodStart: string,
  periodEnd: string,
): Promise<number> {
  const supabase = await createClient();

  const { data: feature, error: featureError } = await supabase
    .from("service_features")
    .select("id")
    .eq("slug", featureSlug)
    .maybeSingle();

  if (featureError) {
    logDataQueryError("client-subscriptions.getUsageForSubscription.feature", featureError);
    return 0;
  }

  if (!feature) return 0;

  const { data, error: usageError } = await supabase
    .from("usage_records")
    .select("quantity_used")
    .eq("subscription_id", subscriptionId)
    .eq("feature_id", feature.id)
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd);

  if (usageError) {
    logDataQueryError("client-subscriptions.getUsageForSubscription.usage", usageError);
    return 0;
  }

  return (
    data?.reduce((sum, row) => sum + Number(row.quantity_used ?? 0), 0) ?? 0
  );
}

export async function getClientServicesOverview(
  companyIds: string[],
): Promise<ClientServiceOverview[]> {
  const subscriptions = await getClientSubscriptions(companyIds);
  const overviews: ClientServiceOverview[] = [];

  for (const subscription of subscriptions) {
    const entitlements = await getSubscriptionEntitlements(subscription.id);

    const periodStart =
      subscription.current_period_start?.slice(0, 10) ??
      new Date().toISOString().slice(0, 10);
    const periodEnd =
      subscription.current_period_end?.slice(0, 10) ??
      new Date().toISOString().slice(0, 10);

    const usage: UsageSummary[] = [];

    for (const entitlement of entitlements) {
      if (entitlement.value_type !== "numeric") continue;

      const used = await getUsageForSubscription(
        subscription.id,
        entitlement.feature_slug,
        periodStart,
        periodEnd,
      );

      const summary = buildUsageSummary(
        entitlement,
        used,
        periodStart,
        periodEnd,
      );
      if (summary) usage.push(summary);
    }

    overviews.push({ subscription, entitlements, usage });
  }

  return overviews;
}

/** Alias for getClientServicesOverview — all active services/subscriptions for a client. */
export const getClientServices = getClientServicesOverview;

export async function getSubscriptionFeatures(
  subscriptionId: string,
): Promise<SubscriptionEntitlement[]> {
  return getSubscriptionEntitlements(subscriptionId);
}

export async function getMergedClientEntitlements(
  companyIds: string[],
): Promise<SubscriptionEntitlement[]> {
  const subscriptions = await getClientSubscriptions(companyIds);
  const groups = await Promise.all(
    subscriptions.map((sub) => getSubscriptionEntitlements(sub.id)),
  );
  return mergeEntitlements(groups);
}

export async function getPrimaryMaintenanceOverview(
  companyIds: string[],
): Promise<ClientServiceOverview | null> {
  const overviews = await getClientServicesOverview(companyIds);
  return (
    overviews.find(
      (item) =>
        item.subscription.service?.slug === "maintenance" &&
        item.subscription.plan,
    ) ?? overviews[0] ?? null
  );
}

export { FEATURE_SLUGS };
