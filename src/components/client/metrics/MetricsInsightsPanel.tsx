interface InsightItem {
  kind: "fact" | "opportunity" | "limit";
  text: string;
}

interface MetricsInsightsPanelProps {
  title: string;
  items: InsightItem[];
  legendFact: string;
  legendOpportunity: string;
  legendLimit: string;
}

const kindStyles = {
  fact: "border-[#2563EB]/30 bg-[#2563EB]/10 text-[#BFDBFE]",
  opportunity: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  limit: "border-[#1E293B] bg-[#050816]/60 text-[#94A3B8]",
};

export function MetricsInsightsPanel({
  title,
  items,
  legendFact,
  legendOpportunity,
  legendLimit,
}: MetricsInsightsPanelProps) {
  if (!items.length) return null;

  return (
    <section className="mb-8 rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item, index) => (
          <li
            key={index}
            className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${kindStyles[item.kind]}`}
          >
            <span className="mr-2 text-[10px] font-semibold uppercase tracking-wide opacity-80">
              {item.kind === "fact"
                ? legendFact
                : item.kind === "opportunity"
                  ? legendOpportunity
                  : legendLimit}
            </span>
            {item.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
