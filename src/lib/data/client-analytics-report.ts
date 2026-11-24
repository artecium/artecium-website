import type { ClientAnalyticsMetricRow } from "@/lib/data/client-analytics";
import { filterRowsByDateRange, percentChange } from "@/lib/data/client-metrics-range";

export interface AnalyticsPeriodTotals {
  usersSum: number;
  sessions: number;
  pageViews: number;
  conversions: number;
  daysWithData: number;
}

export function aggregateAnalyticsPeriod(
  rows: ClientAnalyticsMetricRow[],
): AnalyticsPeriodTotals {
  let usersSum = 0;
  let sessions = 0;
  let pageViews = 0;
  let conversions = 0;

  for (const row of rows) {
    usersSum += row.users ?? 0;
    sessions += row.sessions ?? 0;
    pageViews += row.page_views ?? 0;
    conversions += row.conversions ?? 0;
  }

  return {
    usersSum,
    sessions,
    pageViews,
    conversions,
    daysWithData: rows.length,
  };
}

export function buildAnalyticsPeriodReport(
  allMetrics: ClientAnalyticsMetricRow[],
  currentFrom: string,
  currentTo: string,
  previousFrom: string,
  previousTo: string,
) {
  const currentRows = filterRowsByDateRange(allMetrics, currentFrom, currentTo);
  const previousRows = filterRowsByDateRange(allMetrics, previousFrom, previousTo);

  const current = aggregateAnalyticsPeriod(currentRows);
  const previous = aggregateAnalyticsPeriod(previousRows);

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
      usersSum: percentChange(current.usersSum, previous.usersSum),
      sessions: percentChange(current.sessions, previous.sessions),
      pageViews: percentChange(current.pageViews, previous.pageViews),
      conversions: percentChange(current.conversions, previous.conversions),
    },
    isDemo,
  };
}

export function buildAnalyticsInsights(
  report: ReturnType<typeof buildAnalyticsPeriodReport>,
  breakdown: ReturnType<typeof mergeAnalyticsBreakdowns>,
): Array<{ kind: "fact" | "opportunity" | "limit"; id: string; params?: Record<string, string | number> }> {
  const items: Array<{
    kind: "fact" | "opportunity" | "limit";
    id: string;
    params?: Record<string, string | number>;
  }> = [];
  const { changes, current, previous } = report;

  if (changes.sessions !== null && Math.abs(changes.sessions) >= 5) {
    items.push({
      kind: "fact",
      id: changes.sessions > 0 ? "sessionsUp" : "sessionsDown",
      params: { percent: Math.abs(changes.sessions).toFixed(0) },
    });
  }

  if (breakdown.channels?.length) {
    const top = [...breakdown.channels].sort(
      (a, b) => (b.sessions ?? 0) - (a.sessions ?? 0),
    )[0];
    if (top?.channel) {
      items.push({
        kind: "fact",
        id: "topChannel",
        params: { channel: top.channel, sessions: top.sessions ?? 0 },
      });
    }
  }

  if (breakdown.pages?.length) {
    const topPage = [...breakdown.pages].sort(
      (a, b) => (b.page_views ?? 0) - (a.page_views ?? 0),
    )[0];
    if (topPage?.path) {
      items.push({
        kind: "fact",
        id: "topPage",
        params: { path: topPage.path, views: topPage.page_views ?? 0 },
      });
    }
  }

  if (current.daysWithData === 0) {
    items.push({ kind: "limit", id: "noDays" });
  }

  if (
    !(breakdown.channels?.length || breakdown.pages?.length || breakdown.events?.length)
  ) {
    items.push({ kind: "limit", id: "noDimensions" });
  }

  if (previous.sessions > 0 && current.sessions < previous.sessions * 0.85) {
    items.push({ kind: "fact", id: "trafficDrop" });
  }

  return items;
}

/** Optional breakdown stored in sync payload (not populated by current seed). */
export type AnalyticsPayloadBreakdown = {
  demo?: boolean;
  channels?: Array<{
    channel: string;
    sessions?: number;
    users?: number;
    page_views?: number;
  }>;
  pages?: Array<{
    path: string;
    page_views?: number;
    users?: number;
  }>;
  devices?: Array<{ device: string; sessions?: number; users?: number }>;
  countries?: Array<{ country: string; sessions?: number; users?: number }>;
  events?: Array<{ name: string; count?: number }>;
};

export function mergeAnalyticsBreakdowns(
  rows: ClientAnalyticsMetricRow[],
): AnalyticsPayloadBreakdown {
  const channels = new Map<string, { sessions: number; users: number; page_views: number }>();
  const pages = new Map<string, { page_views: number; users: number }>();
  const devices = new Map<string, { sessions: number; users: number }>();
  const countries = new Map<string, { sessions: number; users: number }>();
  const events = new Map<string, number>();

  for (const row of rows) {
    const payload = row.payload as AnalyticsPayloadBreakdown | null | undefined;
    if (!payload) continue;

    for (const ch of payload.channels ?? []) {
      const key = ch.channel || "unknown";
      const prev = channels.get(key) ?? { sessions: 0, users: 0, page_views: 0 };
      channels.set(key, {
        sessions: prev.sessions + (ch.sessions ?? 0),
        users: prev.users + (ch.users ?? 0),
        page_views: prev.page_views + (ch.page_views ?? 0),
      });
    }
    for (const p of payload.pages ?? []) {
      const key = p.path || "/";
      const prev = pages.get(key) ?? { page_views: 0, users: 0 };
      pages.set(key, {
        page_views: prev.page_views + (p.page_views ?? 0),
        users: prev.users + (p.users ?? 0),
      });
    }
    for (const d of payload.devices ?? []) {
      const key = d.device || "unknown";
      const prev = devices.get(key) ?? { sessions: 0, users: 0 };
      devices.set(key, {
        sessions: prev.sessions + (d.sessions ?? 0),
        users: prev.users + (d.users ?? 0),
      });
    }
    for (const c of payload.countries ?? []) {
      const key = c.country || "unknown";
      const prev = countries.get(key) ?? { sessions: 0, users: 0 };
      countries.set(key, {
        sessions: prev.sessions + (c.sessions ?? 0),
        users: prev.users + (c.users ?? 0),
      });
    }
    for (const e of payload.events ?? []) {
      const key = e.name || "event";
      events.set(key, (events.get(key) ?? 0) + (e.count ?? 0));
    }
  }

  return {
    channels: [...channels.entries()].map(([channel, v]) => ({ channel, ...v })),
    pages: [...pages.entries()].map(([path, v]) => ({ path, ...v })),
    devices: [...devices.entries()].map(([device, v]) => ({ device, ...v })),
    countries: [...countries.entries()].map(([country, v]) => ({ country, ...v })),
    events: [...events.entries()].map(([name, count]) => ({ name, count })),
  };
}
