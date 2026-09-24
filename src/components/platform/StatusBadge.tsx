interface StatusBadgeProps {
  label: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}

const toneClasses = {
  default: "border-[#1E293B] bg-[#0E1324] text-[#94A3B8]",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  danger: "border-red-500/30 bg-red-500/10 text-red-300",
  info: "border-[#2563EB]/30 bg-[#2563EB]/10 text-[#93C5FD]",
};

export function StatusBadge({ label, tone = "default" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
