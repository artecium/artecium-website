"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

const PRESETS = [
  { id: "7d", labelKey: "period7d" },
  { id: "28d", labelKey: "period28d" },
  { id: "90d", labelKey: "period90d" },
  { id: "this_month", labelKey: "periodThisMonth" },
  { id: "last_month", labelKey: "periodLastMonth" },
  { id: "custom", labelKey: "periodCustom" },
] as const;

interface MetricsPeriodToolbarProps {
  labels: Record<(typeof PRESETS)[number]["labelKey"], string> & {
    periodFrom: string;
    periodTo: string;
    periodApply: string;
  };
  currentPeriod: string;
  from: string;
  to: string;
  periodRangeLabel: string;
  lastUpdatedLabel?: string;
}

export function MetricsPeriodToolbar({
  labels,
  currentPeriod,
  from,
  to,
  periodRangeLabel,
  lastUpdatedLabel,
}: MetricsPeriodToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);

  const apply = useCallback(
    (period: string, nextFrom?: string, nextTo?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("period", period);
      if (period === "custom" && nextFrom && nextTo) {
        params.set("from", nextFrom);
        params.set("to", nextTo);
      } else {
        params.delete("from");
        params.delete("to");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="mb-6 space-y-4 rounded-2xl border border-[#1E293B] bg-[#0E1324] p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
            {periodRangeLabel}
          </p>
          {lastUpdatedLabel ? (
            <p className="mt-1 text-sm text-[#94A3B8]">{lastUpdatedLabel}</p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => apply(preset.id)}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] ${
              currentPeriod === preset.id
                ? "bg-[#2563EB] text-white"
                : "border border-[#1E293B] text-[#94A3B8] hover:border-[#2563EB]/40 hover:text-white"
            }`}
          >
            {labels[preset.labelKey]}
          </button>
        ))}
      </div>
      {currentPeriod === "custom" ? (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            apply("custom", customFrom, customTo);
          }}
        >
          <label className="text-sm text-[#94A3B8]">
            {labels.periodFrom}
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="mt-1 block rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
            />
          </label>
          <label className="text-sm text-[#94A3B8]">
            {labels.periodTo}
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="mt-1 block rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8]"
          >
            {labels.periodApply}
          </button>
        </form>
      ) : null}
    </div>
  );
}
