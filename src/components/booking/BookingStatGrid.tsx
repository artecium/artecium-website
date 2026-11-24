interface Stat {
  label: string;
  value: number;
}

export function BookingStatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-[#1E293B] bg-[#0E1324]/60 px-5 py-4"
        >
          <p className="text-sm text-[#94A3B8]">{stat.label}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-white">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
