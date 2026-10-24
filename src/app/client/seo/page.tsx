import { SimpleBarChart } from "@/components/platform/SimpleBarChart";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { resolveLocale } from "@/i18n/config";
import {
  clientHasSeoService,
  isSeoIncluded,
} from "@/lib/data/client-dashboard";
import { getClientSeoOverview } from "@/lib/data/client-seo";
import { formatDate, formatStatusLabel } from "@/lib/data/client-format";
import {
  getClientSubscriptions,
  getMergedClientEntitlements,
  getServicesSchemaState,
} from "@/lib/data/client-subscriptions";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { requireClientAuth } from "@/lib/auth/session";
import { getLocale, getTranslations } from "next-intl/server";

export default async function ClientSeoPage() {
  const locale = resolveLocale(await getLocale());
  const t = await getTranslations("seo");
  const tCommon = await getTranslations("common");
  const tErrors = await getTranslations("errors");
  const tStatus = await getTranslations("status");

  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;
  const dbState = await getDatabaseReadyState();
  const schema = await getServicesSchemaState(companyIds);
  const subscriptions = await getClientSubscriptions(companyIds);
  const entitlements = await getMergedClientEntitlements(companyIds);
  const included = isSeoIncluded(subscriptions, entitlements);
  const seoResult = await getClientSeoOverview(companyIds);
  const overview = seoResult.data;

  if (!included) {
    return (
      <>
        <PageHeader title={t("title")} description={t("description")} />
        <EmptyState
          title={t("notIncludedTitle")}
          description={t("notIncludedDescription")}
        />
      </>
    );
  }

  if (seoResult.accessDenied || seoResult.error) {
    return (
      <>
        <PageHeader title={t("title")} description={t("description")} />
        <EmptyState
          title={tErrors("loadFailedTitle")}
          description={
            seoResult.accessDenied
              ? t("accessDeniedDescription")
              : t("loadFailedDescription")
          }
        />
      </>
    );
  }

  if (!overview.connection) {
    return (
      <>
        <PageHeader title={t("title")} description={t("description")} />
        <EmptyState
          title={t("notConnectedTitle")}
          description={t("notConnectedDescription")}
        />
      </>
    );
  }

  const metrics = overview.metrics;
  const latest = metrics[metrics.length - 1];
  const labels = metrics.map((row) => formatDate(row.metric_date, locale));

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

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
            {overview.connection.display_name ?? "Search Console"}
          </h2>
          <StatusBadge
            label={formatStatusLabel(overview.connection.status, tStatus)}
            tone="success"
          />
        </div>
        <p className="mt-2 text-sm text-[#94A3B8]">
          {t("site")}: {overview.connection.site_url ?? tCommon("emptyDash")}
        </p>
        {clientHasSeoService(subscriptions) ? (
          <p className="mt-1 text-xs text-[#64748B]">{t("includedInServices")}</p>
        ) : null}
      </div>

      {metrics.length ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: t("clicks"), value: latest?.clicks },
              { label: t("impressions"), value: latest?.impressions },
              {
                label: t("ctr"),
                value:
                  latest?.ctr !== null && latest?.ctr !== undefined
                    ? `${(latest.ctr * 100).toFixed(2)}%`
                    : tCommon("emptyDash"),
              },
              { label: t("avgPosition"), value: latest?.average_position },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-4"
              >
                <p className="text-xs uppercase tracking-wide text-[#64748B]">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {metric.value ?? tCommon("emptyDash")}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SimpleBarChart
              title={t("chartClicks")}
              labels={labels}
              values={metrics.map((m) => m.clicks ?? 0)}
            />
            <SimpleBarChart
              title={t("chartImpressions")}
              labels={labels}
              values={metrics.map((m) => m.impressions ?? 0)}
              color="#60A5FA"
            />
          </div>
        </>
      ) : (
        <EmptyState title={t("noDataTitle")} description={t("noDataDescription")} />
      )}
    </>
  );
}
