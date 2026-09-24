import {
  type DataFetchResult,
  fromQueryResult,
  skippedFetchResult,
} from "@/lib/data/supabase-query";
import { createClient } from "@/lib/supabase/server";

export interface ClientSeoConnection {
  id: string;
  site_url: string | null;
  display_name: string | null;
  status: string;
}

export interface ClientSeoMetricRow {
  id: string;
  metric_date: string;
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
  average_position: number | null;
}

export interface ClientSeoOverview {
  connection: ClientSeoConnection | null;
  metrics: ClientSeoMetricRow[];
}

export async function getClientSeoOverview(
  companyIds: string[],
): Promise<DataFetchResult<ClientSeoOverview>> {
  const empty: ClientSeoOverview = { connection: null, metrics: [] };

  if (!companyIds.length) {
    return skippedFetchResult(empty, "getClientSeoOverview requires companyIds");
  }

  const supabase = await createClient();

  const { data: connection, error: connectionError } = await supabase
    .from("seo_connections")
    .select("id, site_url, display_name, status")
    .in("company_id", companyIds)
    .eq("status", "active")
    .order("connected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (connectionError) {
    return fromQueryResult(
      "client-seo.getClientSeoOverview.connection",
      empty,
      connectionError,
      empty,
    );
  }

  if (!connection) {
    return fromQueryResult("client-seo.getClientSeoOverview", empty, null, empty);
  }

  const { data: metrics, error: metricsError } = await supabase
    .from("seo_data")
    .select("id, metric_date, clicks, impressions, ctr, average_position")
    .eq("connection_id", connection.id)
    .order("metric_date", { ascending: true });

  if (metricsError) {
    return fromQueryResult(
      "client-seo.getClientSeoOverview.metrics",
      empty,
      metricsError,
      empty,
    );
  }

  return fromQueryResult(
    "client-seo.getClientSeoOverview",
    {
      connection: {
        id: connection.id as string,
        site_url: (connection.site_url as string | null) ?? null,
        display_name: (connection.display_name as string | null) ?? null,
        status: connection.status as string,
      },
      metrics: (metrics ?? []).map((row) => ({
        id: row.id as string,
        metric_date: row.metric_date as string,
        clicks: row.clicks !== null ? Number(row.clicks) : null,
        impressions: row.impressions !== null ? Number(row.impressions) : null,
        ctr: row.ctr !== null ? Number(row.ctr) : null,
        average_position:
          row.average_position !== null ? Number(row.average_position) : null,
      })),
    },
    null,
    empty,
  );
}
