import Link from "next/link";

interface AdminStatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
}

export function AdminStatCard({ label, value, hint, href }: AdminStatCardProps) {
  const content = (
    <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-5 transition-colors hover:border-[#2563EB]/30">
      <p className="text-xs uppercase tracking-wide text-[#64748B]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[#94A3B8]">{hint}</p> : null}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
