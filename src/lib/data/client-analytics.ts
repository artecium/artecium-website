import {
  type DataFetchResult,
  fromQueryResult,
  skippedFetchResult,
} from "@/lib/data/supabase-query";
import { createClient } from "@/lib/supabase/server";

export interface ClientAnalyticsConnection {
  id: string;
  property_id: string | null;
  display_name: string | null;
  status: string;
}

export interface ClientAnalyticsMetricRow {
  id: string;
  metric_date: string;
  users: number | null;
  sessions: number | null;
  page_views: number | null;
  conversions: number | null;
}

export interface ClientAnalyticsOverview {
  connection: ClientAnalyticsConnection | null;
  metrics: ClientAnalyticsMetricRow[];
}

export async function getClientAnalyticsOverview(
  companyIds: string[],
): Promise<DataFetchResult<ClientAnalyticsOverview>> {
  const empty: ClientAnalyticsOverview = { connection: null, metrics: [] };

  if (!companyIds.length) {
    return skippedFetchResult(empty, "getClientAnalyticsOverview requires companyIds");
  }

  const supabase = await createClient();

  const { data: connection, error: connectionError } = await supabase
    .from("analytics_connections")
    .select("id, property_id, display_name, status")
    .in("company_id", companyIds)
    .eq("status", "active")
    .order("connected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (connectionError) {
    return fromQueryResult(
      "client-analytics.getClientAnalyticsOverview.connection",
      empty,
      connectionError,
      empty,
    );
  }

  if (!connection) {
    return fromQueryResult(
      "client-analytics.getClientAnalyticsOverview",
      empty,
      null,
      empty,
    );
  }

  const { data: metrics, error: metricsError } = await supabase
    .from("analytics_data")
    .select("id, metric_date, users, sessions, page_views, conversions")
    .eq("connection_id", connection.id)
    .order("metric_date", { ascending: true });

  if (metricsError) {
    return fromQueryResult(
      "client-analytics.getClientAnalyticsOverview.metrics",
      empty,
      metricsError,
      empty,
    );
  }

  return fromQueryResult(
    "client-analytics.getClientAnalyticsOverview",
    {
      connection: {
        id: connection.id as string,
        property_id: (connection.property_id as string | null) ?? null,
        display_name: (connection.display_name as string | null) ?? null,
        status: connection.status as string,
      },
      metrics: (metrics ?? []).map((row) => ({
        id: row.id as string,
        metric_date: row.metric_date as string,
        users: row.users !== null ? Number(row.users) : null,
        sessions: row.sessions !== null ? Number(row.sessions) : null,
        page_views: row.page_views !== null ? Number(row.page_views) : null,
        conversions: row.conversions !== null ? Number(row.conversions) : null,
      })),
    },
    null,
    empty,
  );
}
