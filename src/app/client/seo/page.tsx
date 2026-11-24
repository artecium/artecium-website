import { MetricsConnectionBanner } from "@/components/client/metrics/MetricsConnectionBanner";
import { MetricsDataTable } from "@/components/client/metrics/MetricsDataTable";
import { MetricsInsightsPanel } from "@/components/client/metrics/MetricsInsightsPanel";
import { MetricsKpiGrid } from "@/components/client/metrics/MetricsKpiGrid";
import { MetricsPeriodToolbar } from "@/components/client/metrics/MetricsPeriodToolbar";
import { MetricsTimeSeriesPanel } from "@/components/client/metrics/MetricsTimeSeriesPanel";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { resolveLocale } from "@/i18n/config";
import { requireClientAuth } from "@/lib/auth/session";
import { clientHasSeoService, isSeoIncluded } from "@/lib/data/client-dashboard";
import { formatDate, formatStatusLabel } from "@/lib/data/client-format";
import { parseMetricsPeriod } from "@/lib/data/client-metrics-range";
import {
  buildSeoInsights,
  buildSeoPeriodReport,
  mergeSeoBreakdowns,
} from "@/lib/data/client-seo-report";
import { getClientSeoOverview } from "@/lib/data/client-seo";
import {
  getClientSubscriptions,
  getMergedClientEntitlements,
  getServicesSchemaState,
} from "@/lib/data/client-subscriptions";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

const SEO_INSIGHT_KEYS: Record<string, string> = {
  clicksUp: "insightsClicksUp",
  clicksDown: "insightsClicksDown",
  lowCtr: "insightsLowCtr",
  queryLowCtr: "insightsQueryLowCtr",
  clicksDrop: "insightsClicksDrop",
  noQueryPageData: "insightsNoQueryPageData",
};

async function SeoBody({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string };
}) {
  const locale = resolveLocale(await getLocale());
  const t = await getTranslations("seo");
  const tCommon = await getTranslations("common");
  const tStatus = await getTranslations("status");

  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;
  const period = parseMetricsPeriod(searchParams);
  const seoResult = await getClientSeoOverview(companyIds);
  const overview = seoResult.data!;

  const report = buildSeoPeriodReport(
    overview.metrics,
    period.current.from,
    period.current.to,
    period.previous.from,
    period.previous.to,
  );
  const breakdown = mergeSeoBreakdowns(report.currentRows);
  const insightItems = buildSeoInsights(report, breakdown).map((item) => ({
    kind: item.kind,
    text: t(
      (SEO_INSIGHT_KEYS[item.id] ?? "insightsNoQueryPageData") as "insightsNoQueryPageData",
      item.params as Record<string, string>,
    ),
  }));

  const isDemo =
    report.isDemo || overview.connection!.site_url?.includes("demo.") === true;

  const syncLine = overview.connection!.last_sync_at
    ? t("lastSync", { date: formatDate(overview.connection!.last_sync_at!, locale) })
    : t("noSyncYet");

  const seriesPoints = report.currentRows.map((row) => ({
    date: row.metric_date,
    label: formatDate(row.metric_date, locale),
    values: {
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr !== null ? Math.round(row.ctr * 10000) / 100 : 0,
      position: row.average_position ?? 0,
    },
  }));

  const totals = report.current;

  if (totals.daysWithData === 0) {
    return <EmptyState title={t("noDataTitle")} description={t("noDataDescription")} />;
  }

  const ctrDisplay =
    totals.ctr !== null ? `${(totals.ctr * 100).toFixed(2)}%` : tCommon("emptyDash");
  const positionDisplay =
    totals.averagePosition !== null
      ? totals.averagePosition.toFixed(1)
      : tCommon("emptyDash");

  return (
    <>
      <MetricsConnectionBanner
        name={overview.connection!.display_name ?? "Search Console"}
        statusLabel={formatStatusLabel(overview.connection!.status, tStatus)}
        propertyLine={`${t("site")}: ${overview.connection!.site_url ?? tCommon("emptyDash")}`}
        syncLine={syncLine}
        demoWarning={isDemo ? t("demoDataWarning") : undefined}
      />

      <p className="mb-4 text-xs text-[#64748B]">{t("storedDataNotice")}</p>

      <MetricsPeriodToolbar
        labels={{
          period7d: t("period7d"),
          period28d: t("period28d"),
          period90d: t("period90d"),
          periodThisMonth: t("periodThisMonth"),
          periodLastMonth: t("periodLastMonth"),
          periodCustom: t("periodCustom"),
          periodFrom: t("periodFrom"),
          periodTo: t("periodTo"),
          periodApply: t("periodApply"),
        }}
        currentPeriod={period.current.preset}
        from={period.current.from}
        to={period.current.to}
        periodRangeLabel={t("periodAnalyzed", {
          from: formatDate(period.current.from, locale),
          to: formatDate(period.current.to, locale),
        })}
        lastUpdatedLabel={syncLine}
      />

      <MetricsKpiGrid
        changeLabel={t("changeVsPrevious")}
        unavailableLabel={t("unavailableMetric")}
        items={[
          {
            id: "clicks",
            label: t("clicks"),
            value: String(totals.clicks),
            changePercent: report.changes.clicks,
          },
          {
            id: "impressions",
            label: t("impressions"),
            value: String(totals.impressions),
            changePercent: report.changes.impressions,
          },
          {
            id: "ctr",
            label: t("ctr"),
            value: ctrDisplay,
            changePercent: report.changes.ctr,
          },
          {
            id: "position",
            label: t("avgPosition"),
            value: positionDisplay,
            changePercent: report.changes.averagePosition,
          },
        ]}
      />

      <div className="mb-8">
        <MetricsTimeSeriesPanel
          title={t("chartTitle")}
          points={seriesPoints}
          defaultMetric="clicks"
          metrics={[
            { key: "clicks", label: t("clicks") },
            { key: "impressions", label: t("impressions") },
            { key: "ctr", label: t("ctr") },
            { key: "position", label: t("avgPosition") },
          ]}
          totalForPeriod={{
            clicks: totals.clicks,
            impressions: totals.impressions,
            ctr: totals.ctr !== null ? Math.round(totals.ctr * 10000) / 100 : 0,
            position: totals.averagePosition ?? 0,
          }}
          totalNote={t("chartTotalNote")}
        />
      </div>

      <MetricsInsightsPanel
        title={t("insightsTitle")}
        items={insightItems}
        legendFact={t("insightFact")}
        legendOpportunity={t("insightOpportunity")}
        legendLimit={t("insightLimit")}
      />

      <p className="mb-6 text-xs text-[#64748B]">{t("diagnosticsLimitNote")}</p>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <MetricsDataTable
          title={t("sectionQueries")}
          rows={(breakdown.queries ?? []) as Record<string, unknown>[]}
          emptyMessage={t("dimensionEmpty")}
          searchPlaceholder={t("searchPlaceholder")}
          exportFilename={breakdown.queries?.length ? t("queriesExport") : undefined}
          exportLabel={t("exportCsv")}
          columns={[
            { key: "query", label: t("colQuery") },
            { key: "clicks", label: t("colClicks"), sortAs: "number" },
            {
              key: "impressions",
              label: t("colImpressions"),
              sortAs: "number",
            },
            {
              key: "ctr",
              label: t("colCtr"),
              render: (r) =>
                r.ctr !== null && r.ctr !== undefined
                  ? `${(Number(r.ctr) * 100).toFixed(2)}%`
                  : "—",
              sortAs: "number",
            },
            {
              key: "position",
              label: t("colPosition"),
              render: (r) =>
                r.position !== null && r.position !== undefined
                  ? Number(r.position).toFixed(1)
                  : "—",
              sortAs: "number",
            },
          ]}
        />
        <MetricsDataTable
          title={t("sectionPages")}
          rows={(breakdown.pages ?? []) as Record<string, unknown>[]}
          emptyMessage={t("dimensionEmpty")}
          searchPlaceholder={t("searchPlaceholder")}
          exportFilename={breakdown.pages?.length ? t("pagesExport") : undefined}
          exportLabel={t("exportCsv")}
          columns={[
            { key: "page", label: t("colPage") },
            { key: "clicks", label: t("colClicks"), sortAs: "number" },
            {
              key: "impressions",
              label: t("colImpressions"),
              sortAs: "number",
            },
            {
              key: "ctr",
              label: t("colCtr"),
              render: (r) =>
                r.ctr !== null && r.ctr !== undefined
                  ? `${(Number(r.ctr) * 100).toFixed(2)}%`
                  : "—",
              sortAs: "number",
            },
            {
              key: "position",
              label: t("colPosition"),
              render: (r) =>
                r.position !== null && r.position !== undefined
                  ? Number(r.position).toFixed(1)
                  : "—",
              sortAs: "number",
            },
          ]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <MetricsDataTable
          title={t("sectionDevices")}
          rows={(breakdown.devices ?? []) as Record<string, unknown>[]}
          emptyMessage={t("dimensionEmpty")}
          searchPlaceholder={t("searchPlaceholder")}
          columns={[
            { key: "device", label: t("colDevice") },
            { key: "clicks", label: t("colClicks"), sortAs: "number" },
          ]}
        />
        <MetricsDataTable
          title={t("sectionCountries")}
          rows={(breakdown.countries ?? []) as Record<string, unknown>[]}
          emptyMessage={t("dimensionEmpty")}
          searchPlaceholder={t("searchPlaceholder")}
          columns={[
            { key: "country", label: t("colCountry") },
            { key: "clicks", label: t("colClicks"), sortAs: "number" },
          ]}
        />
        <MetricsDataTable
          title={t("sectionSearchTypes")}
          rows={(breakdown.searchTypes ?? []) as Record<string, unknown>[]}
          emptyMessage={t("dimensionEmpty")}
          searchPlaceholder={t("searchPlaceholder")}
          columns={[
            { key: "type", label: t("colSearchType") },
            { key: "clicks", label: t("colClicks"), sortAs: "number" },
          ]}
        />
      </div>

      <div className="mt-8">
        <MetricsDataTable
          title={t("chartTitle")}
          rows={report.currentRows.map((r) => ({
            date: r.metric_date,
            clicks: r.clicks,
            impressions: r.impressions,
            ctr: r.ctr,
            average_position: r.average_position,
          }))}
          emptyMessage={t("noDataDescription")}
          searchPlaceholder={t("searchPlaceholder")}
          exportFilename={t("dailyExport")}
          exportLabel={t("exportCsv")}
          columns={[
            { key: "date", label: "Date" },
            { key: "clicks", label: t("clicks"), sortAs: "number" },
            {
              key: "impressions",
              label: t("impressions"),
              sortAs: "number",
            },
            {
              key: "ctr",
              label: t("ctr"),
              render: (r) =>
                r.ctr !== null && r.ctr !== undefined
                  ? `${(Number(r.ctr) * 100).toFixed(2)}%`
                  : "—",
            },
            {
              key: "average_position",
              label: t("avgPosition"),
              render: (r) =>
                r.average_position !== null && r.average_position !== undefined
                  ? Number(r.average_position).toFixed(1)
                  : "—",
            },
          ]}
        />
      </div>
    </>
  );
}

export default async function ClientSeoPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const t = await getTranslations("seo");
  const tCommon = await getTranslations("common");
  const tErrors = await getTranslations("errors");
  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;
  const dbState = await getDatabaseReadyState();
  const schema = await getServicesSchemaState(companyIds);
  const subscriptions = await getClientSubscriptions(companyIds);
  const entitlements = await getMergedClientEntitlements(companyIds);
  const included = isSeoIncluded(subscriptions, entitlements);
  const seoResult = await getClientSeoOverview(companyIds);

  if (!included) {
    return (
      <>
        <PageHeader title={t("title")} description={t("description")} />
        <EmptyState title={t("notIncludedTitle")} description={t("notIncludedDescription")} />
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
            seoResult.accessDenied ? t("accessDeniedDescription") : t("loadFailedDescription")
          }
        />
      </>
    );
  }

  const overview = seoResult.data;

  if (!overview?.connection) {
    return (
      <>
        <PageHeader title={t("title")} description={t("description")} />
        <EmptyState title={t("notConnectedTitle")} description={t("notConnectedDescription")} />
      </>
    );
  }

  if (!overview.metrics.length) {
    return (
      <>
        <PageHeader title={t("title")} description={t("description")} />
        <EmptyState title={t("noDataTitle")} description={t("noDataDescription")} />
      </>
    );
  }

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

      {clientHasSeoService(subscriptions) ? (
        <p className="mb-4 text-xs text-[#64748B]">{t("includedInServices")}</p>
      ) : null}

      <Suspense fallback={<p className="text-sm text-[#94A3B8]">{tCommon("loading")}</p>}>
        <SeoBody searchParams={sp} />
      </Suspense>
    </>
  );
}
