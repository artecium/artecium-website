import { StatusBadge } from "@/components/platform/StatusBadge";

interface MetricsConnectionBannerProps {
  name: string;
  statusLabel: string;
  propertyLine: string;
  syncLine?: string;
  demoWarning?: string;
  includedNote?: string;
}

export function MetricsConnectionBanner({
  name,
  statusLabel,
  propertyLine,
  syncLine,
  demoWarning,
  includedNote,
}: MetricsConnectionBannerProps) {
  return (
    <div className="mb-6 rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-base font-medium text-white">{name}</h2>
        <StatusBadge label={statusLabel} tone="success" />
      </div>
      <p className="mt-2 text-sm text-[#94A3B8]">{propertyLine}</p>
      {syncLine ? <p className="mt-1 text-xs text-[#64748B]">{syncLine}</p> : null}
      {demoWarning ? (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {demoWarning}
        </p>
      ) : null}
      {includedNote ? (
        <p className="mt-2 text-xs text-[#64748B]">{includedNote}</p>
      ) : null}
      <p className="mt-3 text-xs text-[#64748B]">
        {syncLine
          ? undefined
          : null}
      </p>
    </div>
  );
}
