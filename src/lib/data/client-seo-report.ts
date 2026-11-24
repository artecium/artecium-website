import type { ClientSeoMetricRow } from "@/lib/data/client-seo";
import { filterRowsByDateRange, percentChange } from "@/lib/data/client-metrics-range";

export interface SeoPeriodTotals {
  clicks: number;
  impressions: number;
  ctr: number | null;
  averagePosition: number | null;
  daysWithData: number;
}

export function aggregateSeoPeriod(rows: ClientSeoMetricRow[]): SeoPeriodTotals {
  let clicks = 0;
  let impressions = 0;
  let positionWeighted = 0;

  for (const row of rows) {
    const c = row.clicks ?? 0;
    const i = row.impressions ?? 0;
    clicks += c;
    impressions += i;
    if (i > 0 && row.average_position !== null) {
      positionWeighted += row.average_position * i;
    }
  }

  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : null,
    averagePosition: impressions > 0 ? positionWeighted / impressions : null,
    daysWithData: rows.length,
  };
}

export function buildSeoPeriodReport(
  allMetrics: ClientSeoMetricRow[],
  currentFrom: string,
  currentTo: string,
  previousFrom: string,
  previousTo: string,
) {
  const currentRows = filterRowsByDateRange(allMetrics, currentFrom, currentTo);
  const previousRows = filterRowsByDateRange(allMetrics, previousFrom, previousTo);

  const current = aggregateSeoPeriod(currentRows);
  const previous = aggregateSeoPeriod(previousRows);

  const isDemo = allMetrics.some(
    (row) =>
      typeof row.payload === "object" &&
      row.payload !== null &&
      (row.payload as { demo?: boolean }).demo === true,
  );

  return {
    currentRows,
    previousRows,
    current,
    previous,
    changes: {
      clicks: percentChange(current.clicks, previous.clicks),
      impressions: percentChange(current.impressions, previous.impressions),
      ctr:
        current.ctr !== null && previous.ctr !== null && previous.ctr !== 0
          ? percentChange(current.ctr, previous.ctr)
          : null,
      averagePosition:
        current.averagePosition !== null &&
        previous.averagePosition !== null &&
        previous.averagePosition !== 0
          ? percentChange(current.averagePosition, previous.averagePosition)
          : null,
    },
    isDemo,
  };
}

export type SeoPayloadBreakdown = {
  demo?: boolean;
  queries?: Array<{
    query: string;
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  }>;
  pages?: Array<{
    page: string;
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  }>;
  devices?: Array<{ device: string; clicks?: number; impressions?: number }>;
  countries?: Array<{ country: string; clicks?: number; impressions?: number }>;
  searchTypes?: Array<{ type: string; clicks?: number; impressions?: number }>;
};

export function mergeSeoBreakdowns(rows: ClientSeoMetricRow[]): SeoPayloadBreakdown {
  const queries = new Map<
    string,
    { clicks: number; impressions: number; positionWeighted: number }
  >();
  const pages = new Map<
    string,
    { clicks: number; impressions: number; positionWeighted: number }
  >();
  const devices = new Map<string, { clicks: number; impressions: number }>();
  const countries = new Map<string, { clicks: number; impressions: number }>();
  const searchTypes = new Map<string, { clicks: number; impressions: number }>();

  for (const row of rows) {
    const payload = row.payload as SeoPayloadBreakdown | null | undefined;
    if (!payload) continue;

    for (const q of payload.queries ?? []) {
      const key = q.query || "";
      if (!key) continue;
      const prev = queries.get(key) ?? { clicks: 0, impressions: 0, positionWeighted: 0 };
      const imp = q.impressions ?? 0;
      queries.set(key, {
        clicks: prev.clicks + (q.clicks ?? 0),
        impressions: prev.impressions + imp,
        positionWeighted: prev.positionWeighted + (q.position ?? 0) * imp,
      });
    }
    for (const p of payload.pages ?? []) {
      const key = p.page || "";
      if (!key) continue;
      const prev = pages.get(key) ?? { clicks: 0, impressions: 0, positionWeighted: 0 };
      const imp = p.impressions ?? 0;
      pages.set(key, {
        clicks: prev.clicks + (p.clicks ?? 0),
        impressions: prev.impressions + imp,
        positionWeighted: prev.positionWeighted + (p.position ?? 0) * imp,
      });
    }
    for (const d of payload.devices ?? []) {
      const key = d.device || "unknown";
      const prev = devices.get(key) ?? { clicks: 0, impressions: 0 };
      devices.set(key, {
        clicks: prev.clicks + (d.clicks ?? 0),
        impressions: prev.impressions + (d.impressions ?? 0),
      });
    }
    for (const c of payload.countries ?? []) {
      const key = c.country || "unknown";
      const prev = countries.get(key) ?? { clicks: 0, impressions: 0 };
      countries.set(key, {
        clicks: prev.clicks + (c.clicks ?? 0),
        impressions: prev.impressions + (c.impressions ?? 0),
      });
    }
    for (const s of payload.searchTypes ?? []) {
      const key = s.type || "web";
      const prev = searchTypes.get(key) ?? { clicks: 0, impressions: 0 };
      searchTypes.set(key, {
        clicks: prev.clicks + (s.clicks ?? 0),
        impressions: prev.impressions + (s.impressions ?? 0),
      });
    }
  }

  return {
    queries: [...queries.entries()].map(([query, v]) => ({
      query,
      clicks: v.clicks,
      impressions: v.impressions,
      ctr: v.impressions > 0 ? v.clicks / v.impressions : undefined,
      position: v.impressions > 0 ? v.positionWeighted / v.impressions : undefined,
    })),
    pages: [...pages.entries()].map(([page, v]) => ({
      page,
      clicks: v.clicks,
      impressions: v.impressions,
      ctr: v.impressions > 0 ? v.clicks / v.impressions : undefined,
      position: v.impressions > 0 ? v.positionWeighted / v.impressions : undefined,
    })),
    devices: [...devices.entries()].map(([device, v]) => ({ device, ...v })),
    countries: [...countries.entries()].map(([country, v]) => ({ country, ...v })),
    searchTypes: [...searchTypes.entries()].map(([type, v]) => ({ type, ...v })),
  };
}

export function buildSeoInsights(
  report: ReturnType<typeof buildSeoPeriodReport>,
  breakdown: SeoPayloadBreakdown,
): Array<{ kind: "fact" | "opportunity" | "limit"; id: string; params?: Record<string, string | number> }> {
  const insights: Array<{
    kind: "fact" | "opportunity" | "limit";
    id: string;
    params?: Record<string, string | number>;
  }> = [];

  const { current, previous, changes } = report;

  if (changes.clicks !== null && Math.abs(changes.clicks) >= 5) {
    insights.push({
      kind: "fact",
      id: changes.clicks > 0 ? "clicksUp" : "clicksDown",
      params: { percent: Math.abs(changes.clicks).toFixed(0) },
    });
  }

  if (current.impressions > 0 && current.ctr !== null && current.ctr < 0.02) {
    insights.push({ kind: "opportunity", id: "lowCtr" });
  }

  for (const q of breakdown.queries ?? []) {
    if ((q.impressions ?? 0) >= 100 && (q.ctr ?? 1) < 0.015) {
      insights.push({
        kind: "opportunity",
        id: "queryLowCtr",
        params: { query: q.query ?? "" },
      });
      break;
    }
  }

  if (previous.clicks > 0 && current.clicks < previous.clicks * 0.85) {
    insights.push({ kind: "fact", id: "clicksDrop" });
  }

  if (!(breakdown.queries?.length || breakdown.pages?.length)) {
    insights.push({ kind: "limit", id: "noQueryPageData" });
  }

  return insights;
}
