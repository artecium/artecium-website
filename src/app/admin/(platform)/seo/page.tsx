import { AdminListCard } from "@/components/admin/AdminListCard";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { SimpleBarChart } from "@/components/platform/SimpleBarChart";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { requireAdminPage } from "@/lib/auth/admin-access";
import { getAdminSeo } from "@/lib/data/admin/queries";
import { formatStatusLabel } from "@/lib/data/client-format";
import { PERMISSIONS } from "@/types/platform";

export default async function AdminSeoPage() {
  await requireAdminPage(PERMISSIONS.SEO_VIEW);
  const { connections, metrics, error } = await getAdminSeo();

  const metricRows = metrics as Array<{
    metric_date: string;
    clicks: number | null;
    impressions: number | null;
    ctr: number | null;
    average_position: number | null;
  }>;

  const labels = metricRows.map((m) =>
    new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(
      new Date(m.metric_date),
    ),
  );

  return (
    <>
      <PageHeader
        title="SEO"
        description="Search Console connections and SEO metrics from existing data."
      />

      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Unable to load SEO data.
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
                  title={(row.display_name as string) ?? (row.site_url as string) ?? "SEO"}
                  subtitle={companyName ?? (row.site_url as string | null) ?? "—"}
                  meta={<StatusBadge label={formatStatusLabel(row.status as string)} />}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState title="No SEO connections" description="No Search Console connections configured." />
        )}
      </section>

      {metricRows.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <SimpleBarChart
            title="Clicks"
            labels={labels}
            values={metricRows.map((m) => m.clicks ?? 0)}
          />
          <SimpleBarChart
            title="Impressions"
            labels={labels}
            values={metricRows.map((m) => m.impressions ?? 0)}
            color="#8B5CF6"
          />
        </div>
      ) : (
        <EmptyState title="No SEO metrics" description="No SEO metrics available yet." />
      )}
    </>
  );
}
