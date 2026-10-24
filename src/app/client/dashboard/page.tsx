import { UsageProgressBar } from "@/components/platform/ClientServicesPanel";
import { PlatformCard } from "@/components/platform/PlatformCard";
import { PageHeader } from "@/components/platform/PageHeader";
import { EmptyState } from "@/components/platform/EmptyState";
import { StatusBadge } from "@/components/platform/StatusBadge";
import {
  getDashboardMeetings,
  getDashboardProjects,
  getDashboardTickets,
  isAnalyticsIncluded,
  isSeoIncluded,
} from "@/lib/data/client-dashboard";
import {
  getClientServicesOverview,
  getMergedClientEntitlements,
  getPrimaryMaintenanceOverview,
  getServicesSchemaState,
} from "@/lib/data/client-subscriptions";
import {
  getAnalyticsConnectionState,
  getDatabaseReadyState,
  getSeoConnectionState,
} from "@/lib/data/platform-state";
import { getClientPayments } from "@/lib/data/client-payments";
import { getClientNotifications } from "@/lib/data/client-notifications";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatStatusLabel,
  listSectionMessage,
} from "@/lib/data/client-format";
import { ticketStatusTone } from "@/lib/i18n/status";
import { resolveLocale } from "@/i18n/config";
import { requireClientAuth } from "@/lib/auth/session";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

function formatSubscriptionLabel(
  serviceName: string,
  planName: string | undefined,
): string {
  return planName ? `${serviceName} · ${planName}` : serviceName;
}

export default async function ClientDashboardPage() {
  const locale = resolveLocale(await getLocale());
  const t = await getTranslations("dashboard");
  const tClient = await getTranslations("client");
  const tCommon = await getTranslations("common");
  const tErrors = await getTranslations("errors");
  const tStatus = await getTranslations("status");

  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;

  const dbState = await getDatabaseReadyState();
  const servicesSchema = await getServicesSchemaState(companyIds);
  const analyticsState = await getAnalyticsConnectionState(companyIds);
  const seoState = await getSeoConnectionState(companyIds);
  const entitlements = await getMergedClientEntitlements(companyIds);
  const serviceOverviews = await getClientServicesOverview(companyIds);
  const subscriptions = serviceOverviews.map((item) => item.subscription);
  const primaryPlan = await getPrimaryMaintenanceOverview(companyIds);
  const ticketsResult = await getDashboardTickets(companyIds);
  const meetingsResult = await getDashboardMeetings(companyIds);
  const projectsResult = await getDashboardProjects(companyIds);
  const paymentsResult = await getClientPayments(companyIds);
  const notificationsResult = await getClientNotifications(session.user.id);

  const tickets = ticketsResult.data;
  const meetings = meetingsResult.data;
  const projects = projectsResult.data;

  const ticketsSection = listSectionMessage(
    ticketsResult,
    tErrors,
    t("noSupportTickets"),
    t("supportTicketsEmpty"),
  );
  const meetingsSection = listSectionMessage(
    meetingsResult,
    tErrors,
    t("noUpcomingMeetings"),
    t("meetingsEmpty"),
  );
  const projectsSection = listSectionMessage(
    projectsResult,
    tErrors,
    "",
    t("projectsEmpty"),
  );

  const analyticsIncluded = isAnalyticsIncluded(subscriptions, entitlements);
  const seoIncluded = isSeoIncluded(subscriptions, entitlements);

  const analyticsDescription = !analyticsState.configured
    ? analyticsState.message
    : analyticsIncluded
      ? t("analyticsIncluded")
      : t("analyticsNotIncluded");

  const seoDescription = !seoState.configured
    ? seoState.message
    : seoIncluded
      ? t("seoIncluded")
      : t("seoNotIncluded");

  const planSummary = subscriptions.length
    ? subscriptions
        .slice(0, 4)
        .map((subscription) =>
          formatSubscriptionLabel(
            subscription.service?.name ?? tCommon("unknown"),
            subscription.plan?.name,
          ),
        )
        .join(", ")
    : t("planSummaryDefault");

  const primaryProject = projects[0];
  const latestPayment = paymentsResult.data[0];
  const latestNotification = notificationsResult.data[0];
  const unreadNotifications = notificationsResult.data.filter((n) => !n.read_at).length;

  const paymentsDescription = paymentsResult.accessDenied
    ? t("unableToLoadPayments")
    : latestPayment
      ? t("latestPayment", {
          amount: formatCurrency(latestPayment.amount, latestPayment.currency, locale),
          status: formatStatusLabel(latestPayment.status, tStatus),
        })
      : t("noPaymentsYet");

  const notificationsDescription = notificationsResult.accessDenied
    ? t("unableToLoadNotifications")
    : latestNotification
      ? unreadNotifications
        ? t("unreadCount", {
            count: unreadNotifications,
            title: latestNotification.title,
          })
        : latestNotification.title
      : t("noNotificationsYet");

  const greeting = session.profile.full_name
    ? tClient("welcomeBackName", { name: session.profile.full_name })
    : tClient("welcomeBack");

  return (
    <>
      <PageHeader title={greeting} description={t("description")} />

      {!dbState.configured ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {dbState.message}
        </div>
      ) : !servicesSchema.configured ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {servicesSchema.message}
        </div>
      ) : null}

      {serviceOverviews.length ? (
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">{t("currentPlan")}</h2>
            <Link
              href="/client/services"
              className="text-sm text-[#2563EB] transition-colors hover:text-[#60A5FA]"
            >
              {t("viewAllServices")}
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {serviceOverviews.map(({ subscription, usage }) => (
              <div
                key={subscription.id}
                className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-base font-medium text-white">
                    {subscription.service?.name ?? tCommon("unknown")}
                  </h3>
                  <StatusBadge
                    label={formatStatusLabel(subscription.status, tStatus)}
                    tone="info"
                  />
                </div>
                <p className="mt-1 text-sm text-[#94A3B8]">
                  {subscription.plan
                    ? t("planLabel", { name: subscription.plan.name })
                    : subscription.billing_period === "one_time"
                      ? t("oneTimeService")
                      : t("customService")}
                  {subscription.price !== null
                    ? ` · ${formatCurrency(subscription.price, subscription.currency, locale)}`
                    : null}
                </p>
                <p className="mt-1 text-xs text-[#64748B]">
                  {t("startedOn", { date: formatDate(subscription.started_at, locale) })}
                  {subscription.current_period_end
                    ? ` · ${t("renewsOn", { date: formatDate(subscription.current_period_end, locale) })}`
                    : null}
                </p>
                {usage[0] ? (
                  <div className="mt-4">
                    <UsageProgressBar
                      label={usage[0].feature_name}
                      used={usage[0].used}
                      limit={usage[0].limit}
                      unit={usage[0].unit}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : primaryPlan?.subscription.plan ? (
        <div className="mb-8 rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#64748B]">
                {t("myPlan")}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                {primaryPlan.subscription.plan.name}
              </h2>
              <p className="mt-1 text-sm text-[#94A3B8]">
                {primaryPlan.subscription.service?.name} ·{" "}
                {formatStatusLabel(primaryPlan.subscription.status, tStatus)}
              </p>
            </div>
            <Link
              href="/client/services"
              className="text-sm text-[#2563EB] transition-colors hover:text-[#60A5FA]"
            >
              {t("viewAllServices")}
            </Link>
          </div>
          {primaryPlan.usage[0] ? (
            <div className="mt-6">
              <UsageProgressBar
                label={primaryPlan.usage[0].feature_name}
                used={primaryPlan.usage[0].used}
                limit={primaryPlan.usage[0].limit}
                unit={primaryPlan.usage[0].unit}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <PlatformCard
          title={t("activeProjects")}
          description={
            primaryProject
              ? `${primaryProject.name} · ${t("progressComplete", { progress: primaryProject.progress })}`
              : projectsSection.emptyDescription
          }
          href="/client/projects"
        >
          {primaryProject ? (
            <div className="space-y-2">
              {primaryProject.status_label ? (
                <StatusBadge label={primaryProject.status_label} tone="info" />
              ) : null}
              <div className="h-2 overflow-hidden rounded-full bg-[#050816]">
                <div
                  className="h-full rounded-full bg-[#2563EB] transition-all duration-500"
                  style={{ width: `${primaryProject.progress}%` }}
                />
              </div>
            </div>
          ) : null}
        </PlatformCard>
        <PlatformCard
          title={t("currentPlan")}
          description={planSummary}
          href="/client/services"
        />
        <PlatformCard
          title={t("payments")}
          description={paymentsDescription}
          href="/client/payments"
        />
        <PlatformCard
          title={t("notifications")}
          description={notificationsDescription}
          href="/client/notifications"
        />
        <PlatformCard
          title={t("analytics")}
          description={analyticsDescription}
          href="/client/analytics"
        />
        <PlatformCard
          title={t("seo")}
          description={seoDescription}
          href="/client/seo"
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {ticketsSection.hasData ? (
          <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-base font-medium text-white">
                {t("recentSupportTickets")}
              </h3>
              <Link
                href="/client/support"
                className="text-sm text-[#2563EB] transition-colors hover:text-[#60A5FA]"
              >
                {t("viewAll")}
              </Link>
            </div>
            <ul className="space-y-3">
              {tickets.map((ticket) => (
                <li
                  key={ticket.id}
                  className="rounded-xl border border-[#1E293B] bg-[#050816]/40 px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-sm font-medium text-white">
                      {ticket.subject}
                    </p>
                    <StatusBadge
                      label={formatStatusLabel(ticket.status, tStatus)}
                      tone={ticketStatusTone(ticket.status)}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#64748B]">
                    {tCommon("updated")} {formatDateTime(ticket.updated_at, locale)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState
            title={ticketsSection.emptyTitle || t("noSupportTickets")}
            description={ticketsSection.emptyDescription}
          />
        )}

        {meetingsSection.hasData ? (
          <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-base font-medium text-white">
                {t("upcomingMeetings")}
              </h3>
              <Link
                href="/client/meetings"
                className="text-sm text-[#2563EB] transition-colors hover:text-[#60A5FA]"
              >
                {t("viewAll")}
              </Link>
            </div>
            <ul className="space-y-3">
              {meetings.map((meeting) => (
                <li
                  key={meeting.id}
                  className="rounded-xl border border-[#1E293B] bg-[#050816]/40 px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-sm font-medium text-white">
                      {meeting.title}
                    </p>
                    <StatusBadge
                      label={formatStatusLabel(meeting.status, tStatus)}
                      tone="info"
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#64748B]">
                    {formatDateTime(meeting.starts_at, locale)}
                    {meeting.ends_at
                      ? ` – ${formatDateTime(meeting.ends_at, locale)}`
                      : null}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState
            title={meetingsSection.emptyTitle || t("noUpcomingMeetings")}
            description={meetingsSection.emptyDescription}
          />
        )}
      </div>
    </>
  );
}
