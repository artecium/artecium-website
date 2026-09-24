import type { ReactNode } from "react";

interface UsageProgressBarProps {
  label: string;
  used: number;
  limit: number | null;
  unit: string;
}

export function UsageProgressBar({
  label,
  used,
  limit,
  unit,
}: UsageProgressBarProps) {
  const percentage =
    limit && limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#0E1324] p-4">
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-[#94A3B8]">
          {used}
          {limit !== null ? ` / ${limit}` : ""} {unit}
          {limit !== null ? (
            <span className="ml-2 text-[#64748B]">
              ({Math.max(limit - used, 0)} remaining)
            </span>
          ) : null}
        </p>
      </div>
      {limit !== null ? (
        <div className="h-2 overflow-hidden rounded-full bg-[#050816]">
          <div
            className="h-full rounded-full bg-[#2563EB] transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      ) : (
        <p className="text-xs text-[#64748B]">No limit configured</p>
      )}
    </div>
  );
}

interface FeatureListProps {
  title: string;
  features: { name: string; detail?: ReactNode }[];
}

export function FeatureList({ title, features }: FeatureListProps) {
  if (!features.length) return null;

  return (
    <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
      <h3 className="text-base font-medium text-white">{title}</h3>
      <ul className="mt-4 space-y-2">
        {features.map((feature) => (
          <li
            key={feature.name}
            className="flex items-start justify-between gap-4 text-sm text-[#94A3B8]"
          >
            <span>{feature.name}</span>
            {feature.detail ? (
              <span className="shrink-0 text-[#64748B]">{feature.detail}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
