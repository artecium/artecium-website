import { EmptyState } from "@/components/platform/EmptyState";
import type { DashboardActivityItem } from "@/lib/data/client-dashboard-activity";

interface DashboardActivityFeedProps {
  title: string;
  items: DashboardActivityItem[];
  emptyTitle: string;
  emptyDescription: string;
  formatWhen: (iso: string) => string;
  kindLabel: (kind: DashboardActivityItem["kind"]) => string;
}

export function DashboardActivityFeed({
  title,
  items,
  emptyTitle,
  emptyDescription,
  formatWhen,
  kindLabel,
}: DashboardActivityFeedProps) {
  return (
    <section className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {items.length ? (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-[#1E293B] bg-[#050816]/40 px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-medium text-white">{item.title}</p>
                <span className="text-[10px] font-medium uppercase tracking-wide text-[#64748B]">
                  {kindLabel(item.kind)}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#64748B]">
                {formatWhen(item.occurredAt)}
                {item.meta ? ` · ${item.meta}` : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      )}
    </section>
  );
}
