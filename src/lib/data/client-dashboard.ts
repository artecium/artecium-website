import { FEATURE_SLUGS, SERVICE_SLUGS } from "@/config/services/catalog";
import { hasFeature } from "@/lib/services/entitlements";
import {
  type DataFetchResult,
  fromQueryResult,
  skippedFetchResult,
} from "@/lib/data/supabase-query";
import { createClient } from "@/lib/supabase/server";
import type { ClientSubscription, SubscriptionEntitlement } from "@/types/platform";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "trialing",
  "active",
  "past_due",
]);

export interface DashboardTicket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardMeeting {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  status: string;
}

export interface DashboardProject {
  id: string;
  name: string;
  progress: number;
  status_label: string | null;
  status_color: string | null;
}

function isActiveSubscription(subscription: ClientSubscription): boolean {
  return ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status);
}

export function clientHasAnalyticsService(
  subscriptions: ClientSubscription[],
): boolean {
  return subscriptions.some(
    (subscription) =>
      isActiveSubscription(subscription) &&
      subscription.service?.slug === SERVICE_SLUGS.ANALYTICS,
  );
}

export function clientHasSeoService(
  subscriptions: ClientSubscription[],
): boolean {
  return subscriptions.some(
    (subscription) =>
      isActiveSubscription(subscription) &&
      subscription.service?.slug === SERVICE_SLUGS.SEO,
  );
}

export function isAnalyticsIncluded(
  subscriptions: ClientSubscription[],
  entitlements: SubscriptionEntitlement[],
): boolean {
  return (
    hasFeature(entitlements, FEATURE_SLUGS.ANALYTICS_ACCESS) ||
    clientHasAnalyticsService(subscriptions)
  );
}

export function isSeoIncluded(
  subscriptions: ClientSubscription[],
  entitlements: SubscriptionEntitlement[],
): boolean {
  return (
    hasFeature(entitlements, FEATURE_SLUGS.SEO_ACCESS) ||
    clientHasSeoService(subscriptions)
  );
}

export async function getDashboardTickets(
  companyIds: string[],
  limit = 5,
): Promise<DataFetchResult<DashboardTicket[]>> {
  if (!companyIds.length) {
    return skippedFetchResult([], "getDashboardTickets requires companyIds");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("id, subject, status, created_at, updated_at")
    .in("company_id", companyIds)
    .order("updated_at", { ascending: false })
    .limit(limit);

  return fromQueryResult("client-dashboard.getDashboardTickets", data as DashboardTicket[] | null, error, []);
}

export async function getDashboardMeetings(
  companyIds: string[],
  limit = 5,
): Promise<DataFetchResult<DashboardMeeting[]>> {
  if (!companyIds.length) {
    return skippedFetchResult([], "getDashboardMeetings requires companyIds");
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("meetings")
    .select("id, title, starts_at, ends_at, status")
    .in("company_id", companyIds)
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(limit);

  return fromQueryResult("client-dashboard.getDashboardMeetings", data as DashboardMeeting[] | null, error, []);
}

export async function getDashboardProjects(
  companyIds: string[],
  limit = 5,
): Promise<DataFetchResult<DashboardProject[]>> {
  if (!companyIds.length) {
    return skippedFetchResult([], "getDashboardProjects requires companyIds");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      progress,
      project_statuses ( label, color )
    `,
    )
    .in("company_id", companyIds)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    return fromQueryResult("client-dashboard.getDashboardProjects", null, error, []);
  }

  if (!data) {
    return fromQueryResult("client-dashboard.getDashboardProjects", [], null, []);
  }

  const projects = data.map((row) => {
    const status = row.project_statuses as
      | { label: string; color: string | null }
      | { label: string; color: string | null }[]
      | null;

    const statusRow = Array.isArray(status) ? status[0] : status;

    return {
      id: row.id as string,
      name: row.name as string,
      progress: Number(row.progress ?? 0),
      status_label: statusRow?.label ?? null,
      status_color: statusRow?.color ?? null,
    };
  });

  return fromQueryResult("client-dashboard.getDashboardProjects", projects, null, []);
}
