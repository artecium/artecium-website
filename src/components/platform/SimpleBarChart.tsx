interface SimpleBarChartProps {
  title: string;
  labels: string[];
  values: number[];
  valueFormatter?: (value: number) => string;
  color?: string;
}

export function SimpleBarChart({
  title,
  labels,
  values,
  valueFormatter = (value) => String(value),
  color = "#2563EB",
}: SimpleBarChartProps) {
  const max = Math.max(...values, 1);

  return (
    <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-4 sm:p-6">
      <h3 className="mb-4 text-base font-medium text-white">{title}</h3>
      <div className="flex items-end gap-2 sm:gap-3" style={{ minHeight: 160 }}>
        {values.map((value, index) => (
          <div
            key={`${labels[index]}-${index}`}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <span className="text-xs text-[#94A3B8]">{valueFormatter(value)}</span>
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: `${Math.max((value / max) * 120, value > 0 ? 8 : 0)}px`,
                  backgroundColor: color,
                }}
              />
            </div>
            <span className="truncate text-[10px] text-[#64748B] sm:text-xs">
              {labels[index]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
