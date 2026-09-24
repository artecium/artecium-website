import { SimpleBarChart } from "@/components/platform/SimpleBarChart";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import {
  clientHasAnalyticsService,
  isAnalyticsIncluded,
} from "@/lib/data/client-dashboard";
import { getClientAnalyticsOverview } from "@/lib/data/client-analytics";
import { formatDate } from "@/lib/data/client-format";
import {
  getClientSubscriptions,
  getMergedClientEntitlements,
  getServicesSchemaState,
} from "@/lib/data/client-subscriptions";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { requireClientAuth } from "@/lib/auth/session";

export default async function ClientAnalyticsPage() {
  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;
  const dbState = await getDatabaseReadyState();
  const schema = await getServicesSchemaState(companyIds);
  const subscriptions = await getClientSubscriptions(companyIds);
  const entitlements = await getMergedClientEntitlements(companyIds);
  const included = isAnalyticsIncluded(subscriptions, entitlements);
  const analyticsResult = await getClientAnalyticsOverview(companyIds);
  const overview = analyticsResult.data;

  if (!included) {
    return (
      <>
        <PageHeader
          title="Analytics"
          description="Website traffic and conversion metrics from Google Analytics."
        />
        <EmptyState
          title="Analytics not included in your plan"
          description="Your current services do not include analytics access. Contact Artecium to upgrade."
        />
      </>
    );
  }

  if (analyticsResult.accessDenied || analyticsResult.error) {
    return (
      <>
        <PageHeader
          title="Analytics"
          description="Website traffic and conversion metrics from Google Analytics."
        />
        <EmptyState
          title="Unable to load data"
          description={
            analyticsResult.accessDenied
              ? "Access to analytics was denied."
              : "Something went wrong while loading analytics."
          }
        />
      </>
    );
  }

  if (!overview.connection) {
    return (
      <>
        <PageHeader
          title="Analytics"
          description="Website traffic and conversion metrics from Google Analytics."
        />
        <EmptyState
          title="Google Analytics ainda não está ligado."
          description="Metrics will appear here once Google Analytics is connected for your company."
        />
      </>
    );
  }

  const metrics = overview.metrics;
  const latest = metrics[metrics.length - 1];
  const labels = metrics.map((row) => formatDate(row.metric_date));

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Website traffic and conversion metrics from Google Analytics."
      />

      {!dbState.configured ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {dbState.message}
        </div>
      ) : !schema.configured ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {schema.message}
        </div>
      ) : null}

      <div className="mb-6 rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-medium text-white">
            {overview.connection.display_name ?? "Google Analytics"}
          </h2>
          <StatusBadge label={overview.connection.status} tone="success" />
        </div>
        <p className="mt-2 text-sm text-[#94A3B8]">
          Property: {overview.connection.property_id ?? "—"}
        </p>
        {clientHasAnalyticsService(subscriptions) ? (
          <p className="mt-1 text-xs text-[#64748B]">Included in your active services.</p>
        ) : null}
      </div>

      {metrics.length ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Users", value: latest?.users },
              { label: "Sessions", value: latest?.sessions },
              { label: "Page views", value: latest?.page_views },
              { label: "Conversions", value: latest?.conversions },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-4"
              >
                <p className="text-xs uppercase tracking-wide text-[#64748B]">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {metric.value ?? "—"}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SimpleBarChart title="Sessions" labels={labels} values={metrics.map((m) => m.sessions ?? 0)} />
            <SimpleBarChart
              title="Page views"
              labels={labels}
              values={metrics.map((m) => m.page_views ?? 0)}
              color="#60A5FA"
            />
          </div>
        </>
      ) : (
        <EmptyState
          title="No analytics data yet"
          description="Metrics will appear here once Google Analytics data is synced for your company."
        />
      )}
    </>
  );
}
