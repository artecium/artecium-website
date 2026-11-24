"use client";

import { SimpleBarChart } from "@/components/platform/SimpleBarChart";
import { useMemo, useState } from "react";

export type TimeSeriesMetricKey = string;

interface SeriesPoint {
  date: string;
  label: string;
  values: Record<string, number>;
}

interface MetricsTimeSeriesPanelProps {
  title: string;
  points: SeriesPoint[];
  metrics: Array<{ key: string; label: string }>;
  defaultMetric: string;
  totalForPeriod: Record<string, number>;
  totalNote: string;
}

export function MetricsTimeSeriesPanel({
  title,
  points,
  metrics,
  defaultMetric,
  totalForPeriod,
  totalNote,
}: MetricsTimeSeriesPanelProps) {
  const [metric, setMetric] = useState(defaultMetric);

  const labels = points.map((p) => p.label);
  const values = useMemo(
    () => points.map((p) => p.values[metric] ?? 0),
    [points, metric],
  );

  const selected = metrics.find((m) => m.key === metric);

  return (
    <section className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <label className="text-sm text-[#94A3B8]">
          <span className="sr-only">Metric</span>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-sm text-white"
          >
            {metrics.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mb-4 text-xs text-[#64748B]">
        {totalNote}:{" "}
        <span className="font-medium text-[#94A3B8]">
          {totalForPeriod[metric] ?? 0}
        </span>{" "}
        ({selected?.label})
      </p>
      {points.length ? (
        <SimpleBarChart
          title=""
          labels={labels}
          values={values}
          valueFormatter={(v) => String(v)}
        />
      ) : (
        <p className="text-sm text-[#64748B]">—</p>
      )}
    </section>
  );
}
