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
import {
  buildAnalyticsInsights,
  buildAnalyticsPeriodReport,
  mergeAnalyticsBreakdowns,
} from "@/lib/data/client-analytics-report";
import { getClientAnalyticsOverview } from "@/lib/data/client-analytics";
import { clientHasAnalyticsService, isAnalyticsIncluded } from "@/lib/data/client-dashboard";
import { formatDate, formatStatusLabel } from "@/lib/data/client-format";
import { parseMetricsPeriod } from "@/lib/data/client-metrics-range";
import {
  getClientSubscriptions,
  getMergedClientEntitlements,
  getServicesSchemaState,
} from "@/lib/data/client-subscriptions";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

const INSIGHT_KEYS: Record<string, string> = {
  sessionsUp: "insightsSessionsUp",
  sessionsDown: "insightsSessionsDown",
  topChannel: "insightsTopChannel",
  topPage: "insightsTopPage",
  noDays: "insightsNoDays",
  noDimensions: "insightsNoDimensions",
  trafficDrop: "insightsTrafficDrop",
};

async function AnalyticsBody({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string };
}) {
  const locale = resolveLocale(await getLocale());
  const t = await getTranslations("analytics");
  const tCommon = await getTranslations("common");
  const tStatus = await getTranslations("status");

  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;
  const period = parseMetricsPeriod(searchParams);
  const analyticsResult = await getClientAnalyticsOverview(companyIds);
  const overview = analyticsResult.data!;

  const report = buildAnalyticsPeriodReport(
    overview.metrics,
    period.current.from,
    period.current.to,
    period.previous.from,
    period.previous.to,
  );
  const breakdown = mergeAnalyticsBreakdowns(report.currentRows);
  const insightItems = buildAnalyticsInsights(report, breakdown).map((item) => ({
    kind: item.kind,
    text: t(
      (INSIGHT_KEYS[item.id] ?? "insightsNoDimensions") as "insightsNoDimensions",
      item.params as Record<string, string>,
    ),
  }));

  const isDemo =
    report.isDemo || overview.connection!.property_id?.includes("DEMO") === true;

  const syncLine = overview.connection!.last_sync_at
    ? t("lastSync", { date: formatDate(overview.connection!.last_sync_at!, locale) })
    : t("noSyncYet");

  const seriesPoints = report.currentRows.map((row) => ({
    date: row.metric_date,
    label: formatDate(row.metric_date, locale),
    values: {
      sessions: row.sessions ?? 0,
      page_views: row.page_views ?? 0,
      users: row.users ?? 0,
      conversions: row.conversions ?? 0,
    },
  }));

  const totals = report.current;

  if (totals.daysWithData === 0) {
    return <EmptyState title={t("noDataTitle")} description={t("noDataDescription")} />;
  }

  return (
    <>
      <MetricsConnectionBanner
        name={overview.connection!.display_name ?? "Google Analytics"}
        statusLabel={formatStatusLabel(overview.connection!.status, tStatus)}
        propertyLine={`${t("property")}: ${overview.connection!.property_id ?? tCommon("emptyDash")}`}
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
            id: "users",
            label: t("users"),
            value: String(totals.usersSum),
            hint: t("usersPeriodHint"),
            changePercent: report.changes.usersSum,
          },
          {
            id: "sessions",
            label: t("sessions"),
            value: String(totals.sessions),
            changePercent: report.changes.sessions,
          },
          {
            id: "pageViews",
            label: t("pageViews"),
            value: String(totals.pageViews),
            changePercent: report.changes.pageViews,
          },
          {
            id: "conversions",
            label: t("conversions"),
            value: String(totals.conversions),
            changePercent: report.changes.conversions,
          },
        ]}
      />

      <div className="mb-8">
        <MetricsTimeSeriesPanel
          title={t("chartTitle")}
          points={seriesPoints}
          defaultMetric="sessions"
          metrics={[
            { key: "sessions", label: t("sessions") },
            { key: "page_views", label: t("pageViews") },
            { key: "users", label: t("users") },
            { key: "conversions", label: t("conversions") },
          ]}
          totalForPeriod={{
            sessions: totals.sessions,
            page_views: totals.pageViews,
            users: totals.usersSum,
            conversions: totals.conversions,
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

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <MetricsDataTable
          title={t("sectionChannels")}
          rows={(breakdown.channels ?? []) as Record<string, unknown>[]}
          emptyMessage={t("dimensionEmpty")}
          searchPlaceholder={t("searchPlaceholder")}
          exportFilename={breakdown.channels?.length ? "analytics-canais.csv" : undefined}
          exportLabel={t("exportCsv")}
          columns={[
            { key: "channel", label: t("colChannel") },
            { key: "sessions", label: t("colSessions"), sortAs: "number" },
            { key: "users", label: t("colUsers"), sortAs: "number" },
          ]}
        />
        <MetricsDataTable
          title={t("sectionPages")}
          rows={(breakdown.pages ?? []) as Record<string, unknown>[]}
          emptyMessage={t("dimensionEmpty")}
          searchPlaceholder={t("searchPlaceholder")}
          columns={[
            { key: "path", label: t("colPage") },
            { key: "page_views", label: t("colPageViews"), sortAs: "number" },
            { key: "users", label: t("colUsers"), sortAs: "number" },
          ]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MetricsDataTable
          title={t("sectionDevices")}
          rows={(breakdown.devices ?? []) as Record<string, unknown>[]}
          emptyMessage={t("dimensionEmpty")}
          searchPlaceholder={t("searchPlaceholder")}
          columns={[
            { key: "device", label: t("colDevice") },
            { key: "sessions", label: t("colSessions"), sortAs: "number" },
          ]}
        />
        <MetricsDataTable
          title={t("sectionCountries")}
          rows={(breakdown.countries ?? []) as Record<string, unknown>[]}
          emptyMessage={t("dimensionEmpty")}
          searchPlaceholder={t("searchPlaceholder")}
          columns={[
            { key: "country", label: t("colCountry") },
            { key: "sessions", label: t("colSessions"), sortAs: "number" },
          ]}
        />
      </div>

      <div className="mt-8">
        <MetricsDataTable
          title={t("sectionEvents")}
          rows={(breakdown.events ?? []) as Record<string, unknown>[]}
          emptyMessage={t("dimensionEmpty")}
          searchPlaceholder={t("searchPlaceholder")}
          columns={[
            { key: "name", label: t("colEvent") },
            { key: "count", label: t("colCount"), sortAs: "number" },
          ]}
        />
      </div>

      <div className="mt-8">
        <MetricsDataTable
          title={t("chartTitle")}
          rows={report.currentRows.map((r) => ({
            date: r.metric_date,
            users: r.users,
            sessions: r.sessions,
            page_views: r.page_views,
            conversions: r.conversions,
          }))}
          emptyMessage={t("noDataDescription")}
          searchPlaceholder={t("searchPlaceholder")}
          exportFilename={t("dailyExport")}
          exportLabel={t("exportCsv")}
          columns={[
            { key: "date", label: "Date" },
            { key: "users", label: t("users"), sortAs: "number" },
            { key: "sessions", label: t("sessions"), sortAs: "number" },
            { key: "page_views", label: t("pageViews"), sortAs: "number" },
            { key: "conversions", label: t("conversions"), sortAs: "number" },
          ]}
        />
      </div>
    </>
  );
}

export default async function ClientAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const t = await getTranslations("analytics");
  const tCommon = await getTranslations("common");
  const tErrors = await getTranslations("errors");
  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;
  const dbState = await getDatabaseReadyState();
  const schema = await getServicesSchemaState(companyIds);
  const subscriptions = await getClientSubscriptions(companyIds);
  const entitlements = await getMergedClientEntitlements(companyIds);
  const included = isAnalyticsIncluded(subscriptions, entitlements);
  const analyticsResult = await getClientAnalyticsOverview(companyIds);

  if (!included) {
    return (
      <>
        <PageHeader title={t("title")} description={t("description")} />
        <EmptyState title={t("notIncludedTitle")} description={t("notIncludedDescription")} />
      </>
    );
  }

  if (analyticsResult.accessDenied || analyticsResult.error) {
    return (
      <>
        <PageHeader title={t("title")} description={t("description")} />
        <EmptyState
          title={tErrors("loadFailedTitle")}
          description={
            analyticsResult.accessDenied
              ? t("accessDeniedDescription")
              : t("loadFailedDescription")
          }
        />
      </>
    );
  }

  const overview = analyticsResult.data;

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

      {clientHasAnalyticsService(subscriptions) ? (
        <p className="mb-4 text-xs text-[#64748B]">{t("includedInServices")}</p>
      ) : null}

      <Suspense fallback={<p className="text-sm text-[#94A3B8]">{tCommon("loading")}</p>}>
        <AnalyticsBody searchParams={sp} />
      </Suspense>
    </>
  );
}
