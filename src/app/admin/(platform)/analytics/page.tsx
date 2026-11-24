import {
  GoogleIntegrationConnectPanel,
} from "@/components/admin/GoogleIntegrationConnectPanel";
import {
  GoogleIntegrationConnectionCard,
  type AdminGoogleConnectionRow,
} from "@/components/admin/GoogleIntegrationConnectionCard";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { SimpleBarChart } from "@/components/platform/SimpleBarChart";
import { requireAdminPage } from "@/lib/auth/admin-access";
import { getAdminAnalytics, getAdminCompanies } from "@/lib/data/admin/queries";
import { PERMISSIONS } from "@/types/platform";

function mapConnection(row: Record<string, unknown>): AdminGoogleConnectionRow {
  const company = row.companies as { name?: string } | { name?: string }[] | null;
  const companyName = Array.isArray(company) ? company[0]?.name : company?.name;
  return {
    id: row.id as string,
    company_id: row.company_id as string,
    company_name: companyName ?? null,
    display_name: (row.display_name as string | null) ?? null,
    property_id: (row.property_id as string | null) ?? null,
    status: row.status as string,
    connected_at: (row.connected_at as string | null) ?? null,
    last_sync_at: (row.last_sync_at as string | null) ?? null,
  };
}

const GOOGLE_FLASH_MESSAGES: Record<string, string> = {
  connected: "Google account connected. Select a GA4 property below.",
  denied: "Google authorization was cancelled.",
  invalid_state: "Invalid or tampered authorization state.",
  state_expired: "Authorization session expired. Start again.",
  state_reused: "Authorization link was already used.",
  access_denied: "You do not have access to complete this authorization.",
  invalid_callback: "Incomplete Google callback.",
  error: "Google authorization failed. Check server logs.",
};

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage(PERMISSIONS.ANALYTICS_VIEW);
  const params = await searchParams;
  const googleFlash = typeof params.google === "string" ? params.google : null;
  const flashConnectionId =
    typeof params.connectionId === "string" ? params.connectionId : null;

  const [{ connections, metrics, error }, companiesResult] = await Promise.all([
    getAdminAnalytics(),
    getAdminCompanies(),
  ]);

  const companies = (companiesResult.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const connectionRows = (connections ?? []).map((conn) =>
    mapConnection(conn as Record<string, unknown>),
  );

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
        description="Manage Google Analytics connections and review stored metrics."
      />

      {googleFlash ? (
        <div className="mb-6 rounded-xl border border-[#2563EB]/30 bg-[#2563EB]/10 px-4 py-3 text-sm text-[#BFDBFE]">
          {GOOGLE_FLASH_MESSAGES[googleFlash] ?? "Google authorization update."}
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Unable to load analytics data.
        </div>
      ) : null}

      {companies.length ? (
        <GoogleIntegrationConnectPanel kind="analytics" companies={companies} />
      ) : (
        <EmptyState title="No companies" description="Create a client company before connecting GA4." />
      )}

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-medium text-white">Connections</h2>
        {connectionRows.length ? (
          <div className="space-y-3">
            {connectionRows.map((conn) => (
              <GoogleIntegrationConnectionCard
                key={conn.id}
                kind="analytics"
                connection={conn}
                flashConnectionId={flashConnectionId}
              />
            ))}
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
        <EmptyState title="No metrics" description="Metrics appear after GA4 sync (not enabled yet)." />
      )}
    </>
  );
}
