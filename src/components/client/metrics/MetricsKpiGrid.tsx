interface KpiItem {
  id: string;
  label: string;
  value: string;
  hint?: string;
  changePercent: number | null;
  unavailable?: boolean;
}

interface MetricsKpiGridProps {
  items: KpiItem[];
  changeLabel: string;
  unavailableLabel: string;
}

function formatChange(value: number | null): string | null {
  if (value === null) return null;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function MetricsKpiGrid({
  items,
  changeLabel,
  unavailableLabel,
}: MetricsKpiGridProps) {
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const change = formatChange(item.changePercent);
        const positive = (item.changePercent ?? 0) > 0;
        const negative = (item.changePercent ?? 0) < 0;

        return (
          <article
            key={item.id}
            className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-4 shadow-sm shadow-black/10"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
              {item.unavailable ? unavailableLabel : item.value}
            </p>
            {item.hint ? (
              <p className="mt-2 text-xs leading-relaxed text-[#64748B]">{item.hint}</p>
            ) : null}
            {change !== null && !item.unavailable ? (
              <p
                className={`mt-2 text-xs font-medium ${
                  positive
                    ? "text-emerald-400"
                    : negative
                      ? "text-amber-300"
                      : "text-[#64748B]"
                }`}
              >
                {change} {changeLabel}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
