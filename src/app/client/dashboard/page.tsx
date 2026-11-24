import { ClientDashboardHeader } from "@/components/client/dashboard/ClientDashboardHeader";
import { DashboardActivityFeed } from "@/components/client/dashboard/DashboardActivityFeed";
import { DashboardQuickLinks } from "@/components/client/dashboard/DashboardQuickLinks";
import { DashboardStatCard } from "@/components/client/dashboard/DashboardStatCard";
import { UsageProgressBar } from "@/components/platform/ClientServicesPanel";
import { ClientNavIcon } from "@/components/platform/client-nav-icons";
import { EmptyState } from "@/components/platform/EmptyState";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { COMPANY_EMAIL } from "@/config/contact";
import { logClientRouteBeacon } from "@/lib/dev/client-route-diagnostic";
import { resolveLocale } from "@/i18n/config";
import { requireClientAuth } from "@/lib/auth/session";
import {
  buildDashboardActivityFeed,
  countOpenSupportTickets,
  countPendingInvoices,
} from "@/lib/data/client-dashboard-activity";
import {
  countActiveClientSubscriptions,
  getDashboardMeetings,
  getDashboardProjects,
  isAnalyticsIncluded,
  isSeoIncluded,
} from "@/lib/data/client-dashboard";
import { getClientTickets } from "@/lib/data/client-support";
import { getClientDocuments } from "@/lib/data/client-documents";
import { getClientInvoices } from "@/lib/data/client-invoices";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatStatusLabel,
  listSectionMessage,
} from "@/lib/data/client-format";
import { getClientNotifications } from "@/lib/data/client-notifications";
import { getClientPayments } from "@/lib/data/client-payments";
import { getClientProfileContext } from "@/lib/data/client-profile";
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
import { ticketStatusTone } from "@/lib/i18n/status";
import { clientAreaHref, readRequestHostname } from "@/lib/routing";
import type { DashboardActivityItem } from "@/lib/data/client-dashboard-activity";
import { getLocale, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Link from "next/link";

export default async function ClientDashboardPage() {
  logClientRouteBeacon("client/dashboard/page.tsx RENDER start");
  const requestHeaders = await headers();
  const hostname = readRequestHostname((name) => requestHeaders.get(name));
  const t = await getTranslations("dashboard");
  const tClient = await getTranslations("client");
  const tCommon = await getTranslations("common");
  const tErrors = await getTranslations("errors");
  const tStatus = await getTranslations("status");

  const locale = resolveLocale(await getLocale());
  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;

  if (companyIds.length === 0) {
    const tWelcome = await getTranslations("client.welcomeNoCompany");
    const mailSubject =
      locale === "en" ? "Client Area access request" : "Pedido de acesso — Área de Cliente";
    return (
      <>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            {tWelcome("title")}
          </h1>
          <p className="mt-2 text-sm text-[#94A3B8]">{tWelcome("description")}</p>
        </div>
        <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6 sm:p-8">
          <p className="text-sm text-[#94A3B8]">
            {tWelcome("signedInAs", { email: session.profile.email })}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[#CBD5E1]">
            {tWelcome("howToGetAccess")}
          </p>
          <p className="mt-2 text-sm text-[#64748B]">{tWelcome("contactHint")}</p>
          <a
            href={`mailto:${COMPANY_EMAIL}?subject=${encodeURIComponent(mailSubject)}`}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#2563EB] px-6 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
          >
            {tWelcome("contactEmail")}
          </a>
        </div>
      </>
    );
  }

  const dbState = await getDatabaseReadyState();
  const servicesSchema = await getServicesSchemaState(companyIds);
  const analyticsState = await getAnalyticsConnectionState(companyIds);
  const seoState = await getSeoConnectionState(companyIds);
  const profileContext = await getClientProfileContext(session.profile);

  const [
    entitlements,
    serviceOverviews,
    ticketsResult,
    meetingsResult,
    projectsResult,
    paymentsResult,
    notificationsResult,
    invoicesResult,
    documentsResult,
  ] = await Promise.all([
    getMergedClientEntitlements(companyIds),
    getClientServicesOverview(companyIds),
    getClientTickets(companyIds),
    getDashboardMeetings(companyIds),
    getDashboardProjects(companyIds),
    getClientPayments(companyIds),
    getClientNotifications(session.user.id),
    getClientInvoices(companyIds),
    getClientDocuments(companyIds),
  ]);

  const primaryPlan = await getPrimaryMaintenanceOverview(companyIds);
  const subscriptions = serviceOverviews.map((item) => item.subscription);

  const allTickets = ticketsResult.data;
  const tickets = allTickets.slice(0, 5);
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

  const greeting = session.profile.full_name
    ? tClient("welcomeBackName", { name: session.profile.full_name })
    : tClient("welcomeBack");

  const companies = profileContext.data?.companies ?? [];
  const companyLine =
    companies.length === 1
      ? t("companyContext", { name: companies[0]!.name })
      : companies.length > 1
        ? t("companyContext", {
            name: companies.map((c) => c.name).join(", "),
          })
        : undefined;

  const unreadNotifications = notificationsResult.data.filter((n) => !n.read_at).length;
  const projectsInProgress = projects.filter((p) => p.progress < 100).length;
  const activeServices = countActiveClientSubscriptions(subscriptions);
  const pendingInvoices = invoicesResult.error
    ? null
    : countPendingInvoices(invoicesResult.data);
  const openTickets = countOpenSupportTickets(
    allTickets.map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
    })),
  );

  const activityItems = buildDashboardActivityFeed({
    tickets: allTickets.slice(0, 8).map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
    })),
    payments: paymentsResult.data.slice(0, 8),
    notifications: notificationsResult.data.slice(0, 8),
    projects,
    documents: documentsResult.data.slice(0, 8),
    meetings,
    limit: 10,
  });

  const activityKindLabel = (kind: DashboardActivityItem["kind"]) => {
    const map = {
      ticket: t("activityKindTicket"),
      payment: t("activityKindPayment"),
      notification: t("activityKindNotification"),
      project: t("activityKindProject"),
      document: t("activityKindDocument"),
      meeting: t("activityKindMeeting"),
    } as const;
    return map[kind];
  };

  const href = (path: string) => clientAreaHref(path, hostname);

  const quickLinks = [
    { label: t("quickProjects"), href: href("/client/projects") },
    { label: t("quickServices"), href: href("/client/services") },
    { label: t("quickDocuments"), href: href("/client/documents") },
    { label: t("quickInvoices"), href: href("/client/invoices") },
    { label: t("quickSupport"), href: href("/client/support") },
  ];

  return (
    <>
      <ClientDashboardHeader
        greeting={greeting}
        subtitle={t("headerSubtitle")}
        companyLine={companyLine}
        notificationsHref={href("/client/notifications")}
        unreadNotifications={unreadNotifications}
        notificationsLabel={t("notificationsAction")}
        notificationsAria={
          unreadNotifications > 0
            ? t("notificationsUnreadAria", { count: unreadNotifications })
            : t("notificationsAction")
        }
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

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title={t("statProjectsTitle")}
          value={String(projectsInProgress)}
          description={t("statProjectsDesc")}
          href={href("/client/projects")}
          icon={<ClientNavIcon id="projects" />}
        />
        <DashboardStatCard
          title={t("statServicesTitle")}
          value={String(activeServices)}
          description={t("statServicesDesc")}
          href={href("/client/services")}
          icon={<ClientNavIcon id="services" />}
        />
        <DashboardStatCard
          title={t("statInvoicesTitle")}
          value={pendingInvoices === null ? "—" : String(pendingInvoices)}
          description={
            pendingInvoices === null
              ? tErrors("invoicesCompanyUnavailable")
              : t("statInvoicesDesc")
          }
          href={href("/client/invoices")}
          icon={<ClientNavIcon id="invoices" />}
        />
        <DashboardStatCard
          title={t("statSupportTitle")}
          value={String(openTickets)}
          description={t("statSupportDesc")}
          href={href("/client/support")}
          icon={<ClientNavIcon id="support" />}
        />
      </div>

      {serviceOverviews.length ? (
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">{t("currentPlan")}</h2>
            <Link
              href={href("/client/services")}
              className="text-sm text-[#2563EB] transition-colors hover:text-[#60A5FA]"
            >
              {t("viewAllServices")}
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {serviceOverviews.map(({ subscription, usage }) => (
              <div
                key={subscription.id}
                className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6 shadow-sm shadow-black/10"
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
              href={href("/client/services")}
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

      {projects.length ? (
        <section className="mb-8 rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-white">
              {t("projectsSectionTitle")}
            </h2>
            <Link
              href={href("/client/projects")}
              className="text-sm text-[#2563EB] hover:text-[#60A5FA]"
            >
              {t("viewAll")}
            </Link>
          </div>
          <ul className="space-y-3">
            {projects.map((project) => (
              <li
                key={project.id}
                className="rounded-xl border border-[#1E293B] bg-[#050816]/40 px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-white">{project.name}</p>
                    {project.due_date ? (
                      <p className="mt-1 text-xs text-[#64748B]">
                        {t("dueDate", { date: formatDate(project.due_date, locale) })}
                      </p>
                    ) : null}
                  </div>
                  {project.status_label ? (
                    <StatusBadge label={project.status_label} tone="info" />
                  ) : null}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#050816]">
                  <div
                    className="h-full rounded-full bg-[#2563EB] transition-all duration-500 motion-reduce:transition-none"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-[#64748B]">
                  {t("progressComplete", { progress: project.progress })}
                </p>
                <Link
                  href={href(`/client/projects/${project.id}`)}
                  className="mt-3 inline-block text-sm text-[#2563EB] hover:text-[#60A5FA]"
                >
                  {t("viewProjectDetails")} →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : projectsResult.skipped || projectsResult.error ? null : (
        <div className="mb-8">
          <EmptyState title={t("activeProjects")} description={t("projectsEmpty")} />
        </div>
      )}

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <DashboardActivityFeed
          title={t("activityTitle")}
          items={activityItems}
          emptyTitle={t("activityEmptyTitle")}
          emptyDescription={t("activityEmptyDescription")}
          formatWhen={(iso) => formatDateTime(iso, locale)}
          kindLabel={activityKindLabel}
        />
        <DashboardQuickLinks title={t("quickAccessTitle")} links={quickLinks} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={href("/client/analytics")}
          className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-5 transition-colors hover:border-[#2563EB]/25"
        >
          <h3 className="text-base font-medium text-white">{t("analytics")}</h3>
          <p className="mt-2 text-sm text-[#94A3B8]">{analyticsDescription}</p>
        </Link>
        <Link
          href={href("/client/seo")}
          className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-5 transition-colors hover:border-[#2563EB]/25"
        >
          <h3 className="text-base font-medium text-white">{t("seo")}</h3>
          <p className="mt-2 text-sm text-[#94A3B8]">{seoDescription}</p>
        </Link>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {ticketsSection.hasData ? (
          <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-base font-medium text-white">
                {t("recentSupportTickets")}
              </h3>
              <Link
                href={href("/client/support")}
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
                    <p className="text-sm font-medium text-white">{ticket.subject}</p>
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
                href={href("/client/meetings")}
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
                    <p className="text-sm font-medium text-white">{meeting.title}</p>
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
