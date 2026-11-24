import "server-only";

import { google } from "googleapis";

import { getOAuthClientForStoredToken } from "@/lib/google/oauth-client";

export const GA4_SYNC_LOOKBACK_DAYS = 28;

export interface Ga4DailyMetricRow {
  metricDate: string;
  users: number;
  sessions: number;
  pageViews: number;
  conversions: number;
}

function formatGa4ApiDateToIso(yyyymmdd: string): string | null {
  const trimmed = yyyymmdd.trim();
  if (!/^\d{8}$/.test(trimmed)) return null;
  const y = trimmed.slice(0, 4);
  const m = trimmed.slice(4, 6);
  const d = trimmed.slice(6, 8);
  return `${y}-${m}-${d}`;
}

function parseMetricInt(value: string | undefined | null): number {
  if (value == null || value === "") return 0;
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

function isInvalidMetricError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("is not a valid metric") ||
    message.includes("unknown metric") ||
    message.includes("invalid metric")
  );
}

function mapGoogleAnalyticsSyncError(error: unknown): string {
  if (error instanceof Error) {
    const withCode = error as Error & { code?: number; response?: { status?: number } };
    const status = withCode.code ?? withCode.response?.status;
    const message = error.message.toLowerCase();

    if (message.includes("invalid_grant") || message.includes("token has been expired or revoked")) {
      return "Google authorization was revoked or expired. Reconnect Google Analytics.";
    }
    if (status === 401 || status === 403) {
      return "Google denied access to this property. Confirm Viewer access and reconnect if needed.";
    }
    if (status === 429) {
      return "Google Analytics rate limit exceeded. Try again in a few minutes.";
    }
    if (status === 404) {
      return "GA4 property not found. Check the property ID on this connection.";
    }
  }
  return "Unable to sync metrics from Google Analytics.";
}

async function runGa4DailyReport(
  propertyId: string,
  tokenId: string,
  includeConversions: boolean,
): Promise<Ga4DailyMetricRow[]> {
  const normalizedPropertyId = propertyId.replace(/^properties\//, "").trim();
  const { client } = await getOAuthClientForStoredToken(tokenId, "google_analytics");
  const analyticsData = google.analyticsdata({ version: "v1beta", auth: client });

  const metrics: Array<{ name: string }> = [
    { name: "sessions" },
    { name: "screenPageViews" },
    { name: "activeUsers" },
  ];
  if (includeConversions) {
    metrics.push({ name: "conversions" });
  }

  const response = await analyticsData.properties.runReport({
    property: `properties/${normalizedPropertyId}`,
    requestBody: {
      dateRanges: [
        {
          startDate: `${GA4_SYNC_LOOKBACK_DAYS - 1}daysAgo`,
          endDate: "today",
        },
      ],
      dimensions: [{ name: "date" }],
      metrics,
      keepEmptyRows: false,
    },
  });

  const rows: Ga4DailyMetricRow[] = [];
  for (const row of response.data.rows ?? []) {
    const rawDate = row.dimensionValues?.[0]?.value;
    if (!rawDate) continue;
    const metricDate = formatGa4ApiDateToIso(rawDate);
    if (!metricDate) continue;

    const values = row.metricValues ?? [];
    rows.push({
      metricDate,
      sessions: parseMetricInt(values[0]?.value),
      pageViews: parseMetricInt(values[1]?.value),
      users: parseMetricInt(values[2]?.value),
      conversions: includeConversions ? parseMetricInt(values[3]?.value) : 0,
    });
  }

  return rows;
}

export async function fetchGa4DailyMetricsForProperty(
  propertyId: string,
  tokenId: string,
): Promise<Ga4DailyMetricRow[]> {
  try {
    return await runGa4DailyReport(propertyId, tokenId, true);
  } catch (error) {
    if (!isInvalidMetricError(error)) {
      throw error;
    }
    return runGa4DailyReport(propertyId, tokenId, false);
  }
}

export function toPublicSyncError(error: unknown): string {
  return mapGoogleAnalyticsSyncError(error);
}
