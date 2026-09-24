import { AdminListCard } from "@/components/admin/AdminListCard";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { SimpleBarChart } from "@/components/platform/SimpleBarChart";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { requireAdminPage } from "@/lib/auth/admin-access";
import { getAdminAnalytics } from "@/lib/data/admin/queries";
import { formatStatusLabel } from "@/lib/data/client-format";
import { PERMISSIONS } from "@/types/platform";

export default async function AdminAnalyticsPage() {
  await requireAdminPage(PERMISSIONS.ANALYTICS_VIEW);
  const { connections, metrics, error } = await getAdminAnalytics();

  const metricRows = metrics as Array<{
    metric_date: string;
    sessions: number | null;
    users: number | null;
    page_views: number | null;
    conversions: number | null;
  }>;

  const labels = metricRows.map((m) =>
    new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(
      new Date(m.metric_date),
    ),
  );
  const sessions = metricRows.map((m) => m.sessions ?? 0);
  const pageViews = metricRows.map((m) => m.page_views ?? 0);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Analytics connections and metrics from existing Supabase data."
      />

      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Unable to load analytics data.
        </div>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-medium text-white">Connections</h2>
        {connections.length ? (
          <div className="space-y-3">
            {connections.map((conn) => {
              const row = conn as Record<string, unknown>;
              const company = row.companies as { name?: string } | { name?: string }[] | null;
              const companyName = Array.isArray(company) ? company[0]?.name : company?.name;
              return (
                <AdminListCard
                  key={row.id as string}
                  title={(row.display_name as string) ?? (row.property_id as string) ?? "Analytics"}
                  subtitle={companyName ?? "Unknown client"}
                  meta={<StatusBadge label={formatStatusLabel(row.status as string)} />}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState title="No connections" description="No analytics connections configured." />
        )}
      </section>

      {metricRows.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <SimpleBarChart title="Sessions" labels={labels} values={sessions} />
          <SimpleBarChart title="Page views" labels={labels} values={pageViews} color="#10B981" />
        </div>
      ) : (
        <EmptyState title="No metrics" description="No analytics metrics available yet." />
      )}
    </>
  );
}
