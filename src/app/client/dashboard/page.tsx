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
import { formatCurrency } from "@/lib/data/client-format";
import { requireClientAuth } from "@/lib/auth/session";
import Link from "next/link";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatSubscriptionLabel(
  serviceName: string,
  planName: string | undefined,
): string {
  return planName ? `${serviceName} · ${planName}` : serviceName;
}

function dataSectionMessage(
  result: { data: unknown[]; error: string | null; accessDenied: boolean; skipped: boolean },
  emptyDescription: string,
): { hasData: boolean; emptyTitle: string; emptyDescription: string } {
  const hasData = result.data.length > 0;

  if (hasData) {
    return { hasData: true, emptyTitle: "", emptyDescription: "" };
  }

  if (result.skipped) {
    return {
      hasData: false,
      emptyTitle: "Company context unavailable",
      emptyDescription:
        "Your account is not linked to a company yet, so this section cannot load data.",
    };
  }

  if (result.accessDenied) {
    return {
      hasData: false,
      emptyTitle: "Unable to load data",
      emptyDescription:
        "Access to this section was denied. Contact support if this persists.",
    };
  }

  if (result.error) {
    return {
      hasData: false,
      emptyTitle: "Unable to load data",
      emptyDescription: "Something went wrong while loading this section.",
    };
  }

  return {
    hasData: false,
    emptyTitle: "",
    emptyDescription,
  };
}

function ticketStatusTone(
  status: string,
): "default" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "resolved":
    case "closed":
      return "success";
    case "in_progress":
    case "in_review":
      return "info";
    case "waiting_client":
      return "warning";
    default:
      return "default";
  }
}

export default async function ClientDashboardPage() {
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

  const ticketsSection = dataSectionMessage(
    ticketsResult,
    "Your support requests will appear here once you create a ticket.",
  );
  const meetingsSection = dataSectionMessage(
    meetingsResult,
    "Scheduled meetings and review calls will appear here when they are booked.",
  );
  const projectsSection = dataSectionMessage(
    projectsResult,
    "Track progress, timeline, and deliverables.",
  );

  const analyticsIncluded = isAnalyticsIncluded(subscriptions, entitlements);
  const seoIncluded = isSeoIncluded(subscriptions, entitlements);

  const analyticsDescription = !analyticsState.configured
    ? analyticsState.message
    : analyticsIncluded
      ? "View traffic and conversion metrics."
      : "Analytics is not included in your current services.";

  const seoDescription = !seoState.configured
    ? seoState.message
    : seoIncluded
      ? "Monitor search performance."
      : "SEO metrics are not included in your current services.";

  const planSummary = subscriptions.length
    ? subscriptions
        .slice(0, 4)
        .map((subscription) =>
          formatSubscriptionLabel(
            subscription.service?.name ?? "Service",
            subscription.plan?.name,
          ),
        )
        .join(", ")
    : "View your plan, limits, and included services.";

  const primaryProject = projects[0];
  const latestPayment = paymentsResult.data[0];
  const latestNotification = notificationsResult.data[0];
  const unreadNotifications = notificationsResult.data.filter((n) => !n.read_at).length;

  const paymentsDescription = paymentsResult.accessDenied
    ? "Unable to load payment history."
    : latestPayment
      ? `Latest: ${formatCurrency(latestPayment.amount, latestPayment.currency)} · ${latestPayment.status.replace(/_/g, " ")}`
      : "No payments recorded yet.";

  const notificationsDescription = notificationsResult.accessDenied
    ? "Unable to load notifications."
    : latestNotification
      ? `${unreadNotifications ? `${unreadNotifications} unread · ` : ""}${latestNotification.title}`
      : "No notifications yet.";

  const greeting = session.profile.full_name
    ? `Welcome back, ${session.profile.full_name}`
    : "Welcome back";

  return (
    <>
      <PageHeader
        title={greeting}
        description="Overview of your projects, services, payments, and activity."
      />

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
            <h2 className="text-lg font-semibold text-white">Current plan</h2>
            <Link
              href="/client/services"
              className="text-sm text-[#2563EB] transition-colors hover:text-[#60A5FA]"
            >
              View all services →
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
                    {subscription.service?.name ?? "Service"}
                  </h3>
                  <StatusBadge label={subscription.status} tone="info" />
                </div>
                <p className="mt-1 text-sm text-[#94A3B8]">
                  {subscription.plan
                    ? `Plan: ${subscription.plan.name}`
                    : subscription.billing_period === "one_time"
                      ? "One-time service"
                      : "Custom service"}
                  {subscription.price !== null
                    ? ` · ${new Intl.NumberFormat("en-GB", {
                        style: "currency",
                        currency: subscription.currency,
                      }).format(subscription.price)}`
                    : null}
                </p>
                <p className="mt-1 text-xs text-[#64748B]">
                  Started {formatDate(subscription.started_at)}
                  {subscription.current_period_end
                    ? ` · Renews ${formatDate(subscription.current_period_end)}`
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
                My plan
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                {primaryPlan.subscription.plan.name}
              </h2>
              <p className="mt-1 text-sm text-[#94A3B8]">
                {primaryPlan.subscription.service?.name} ·{" "}
                {primaryPlan.subscription.status}
              </p>
            </div>
            <Link
              href="/client/services"
              className="text-sm text-[#2563EB] transition-colors hover:text-[#60A5FA]"
            >
              View all services →
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
          title="Active projects"
          description={
            primaryProject
              ? `${primaryProject.name} · ${primaryProject.progress}% complete`
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
          title="Current plan"
          description={planSummary}
          href="/client/services"
        />
        <PlatformCard
          title="Payments"
          description={paymentsDescription}
          href="/client/payments"
        />
        <PlatformCard
          title="Notifications"
          description={notificationsDescription}
          href="/client/notifications"
        />
        <PlatformCard
          title="Analytics"
          description={analyticsDescription}
          href="/client/analytics"
        />
        <PlatformCard
          title="SEO"
          description={seoDescription}
          href="/client/seo"
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {ticketsSection.hasData ? (
          <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-base font-medium text-white">
                Recent support tickets
              </h3>
              <Link
                href="/client/support"
                className="text-sm text-[#2563EB] transition-colors hover:text-[#60A5FA]"
              >
                View all →
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
                      label={ticket.status.replace(/_/g, " ")}
                      tone={ticketStatusTone(ticket.status)}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#64748B]">
                    Updated {formatDateTime(ticket.updated_at)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState
            title={ticketsSection.emptyTitle || "No support tickets yet"}
            description={ticketsSection.emptyDescription}
          />
        )}

        {meetingsSection.hasData ? (
          <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-base font-medium text-white">
                Upcoming meetings
              </h3>
              <Link
                href="/client/meetings"
                className="text-sm text-[#2563EB] transition-colors hover:text-[#60A5FA]"
              >
                View all →
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
                    <StatusBadge label={meeting.status} tone="info" />
                  </div>
                  <p className="mt-2 text-xs text-[#64748B]">
                    {formatDateTime(meeting.starts_at)}
                    {meeting.ends_at
                      ? ` – ${formatDateTime(meeting.ends_at)}`
                      : null}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState
            title={meetingsSection.emptyTitle || "No upcoming meetings"}
            description={meetingsSection.emptyDescription}
          />
        )}
      </div>
    </>
  );
}
