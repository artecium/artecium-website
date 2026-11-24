/** Preset period keys for client analytics/SEO (URL searchParams). */
export type MetricsPeriodPreset =
  | "7d"
  | "28d"
  | "90d"
  | "this_month"
  | "last_month"
  | "custom";

export interface MetricsDateRange {
  preset: MetricsPeriodPreset;
  from: string;
  to: string;
  labelKey: MetricsPeriodPreset;
}

export interface ResolvedMetricsPeriod {
  current: MetricsDateRange;
  previous: MetricsDateRange;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function endOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function daysInclusive(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

export function parseMetricsPeriod(
  searchParams: {
    period?: string;
    from?: string;
    to?: string;
  },
  now = new Date(),
): ResolvedMetricsPeriod {
  const today = toDateString(now);
  const preset = (searchParams.period ?? "28d") as MetricsPeriodPreset;

  let from = searchParams.from ?? "";
  let to = searchParams.to ?? today;
  let effectivePreset = preset;

  if (preset === "custom" && from && to) {
    effectivePreset = "custom";
  } else if (preset === "7d") {
    from = toDateString(addDays(now, -6));
    to = today;
  } else if (preset === "90d") {
    from = toDateString(addDays(now, -89));
    to = today;
  } else if (preset === "this_month") {
    from = toDateString(startOfMonth(now));
    to = today;
  } else if (preset === "last_month") {
    const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    from = toDateString(startOfMonth(last));
    to = toDateString(endOfMonth(last));
  } else {
    effectivePreset = "28d";
    from = toDateString(addDays(now, -27));
    to = today;
  }

  const span = daysInclusive(from, to);
  const prevTo = toDateString(addDays(new Date(`${from}T00:00:00Z`), -1));
  const prevFrom = toDateString(addDays(new Date(`${prevTo}T00:00:00Z`), -(span - 1)));

  return {
    current: { preset: effectivePreset, from, to, labelKey: effectivePreset },
    previous: {
      preset: effectivePreset,
      from: prevFrom,
      to: prevTo,
      labelKey: effectivePreset,
    },
  };
}

export function filterRowsByDateRange<T extends { metric_date: string }>(
  rows: T[],
  from: string,
  to: string,
): T[] {
  return rows.filter((row) => row.metric_date >= from && row.metric_date <= to);
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return ((current - previous) / previous) * 100;
}
