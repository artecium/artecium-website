import { AdminListCard } from "@/components/admin/AdminListCard";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { requireAdminPage } from "@/lib/auth/admin-access";
import {
  getAdminCompanyCore,
  getAdminCompanyTabData,
  type AdminCompanyTab,
} from "@/lib/data/admin/queries";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatStatusLabel,
} from "@/lib/data/client-format";
import { PERMISSIONS } from "@/types/platform";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "projects", label: "Projects" },
  { id: "services", label: "Services" },
  { id: "tasks", label: "Tasks" },
  { id: "tickets", label: "Tickets" },
  { id: "documents", label: "Documents" },
  { id: "reports", label: "Reports" },
  { id: "meetings", label: "Meetings" },
  { id: "invoices", label: "Invoices" },
  { id: "payments", label: "Payments" },
  { id: "analytics", label: "Analytics" },
  { id: "seo", label: "SEO" },
  { id: "activity", label: "Activity" },
];

const TAB_IDS = new Set(TABS.map((tab) => tab.id));

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminClientDetailPage({
  params,
  searchParams,
}: ClientDetailPageProps) {
  await requireAdminPage(PERMISSIONS.CLIENTS_VIEW);
  const { id } = await params;
  const { tab: rawTab = "overview" } = await searchParams;
  const tab = (TAB_IDS.has(rawTab) ? rawTab : "overview") as AdminCompanyTab;

  const core = await getAdminCompanyCore(id);
  if (!core) notFound();

  const tabData = tab === "overview" ? null : await getAdminCompanyTabData(id, tab);

  const { company, companyUsers } = core;

  return (
    <>
      <PageHeader
        title={company.name}
        description="Customer 360 — all client data in one place."
      />

      <AdminTabs tabs={TABS} activeTab={tab} basePath={`/admin/clients/${id}`} />

      {tab === "overview" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
            <h3 className="mb-4 text-base font-medium text-white">Company details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[#64748B]">Tax ID</dt>
                <dd className="text-white">{company.tax_id ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#64748B]">Website</dt>
                <dd className="text-white">{company.website ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#64748B]">Created</dt>
                <dd className="text-white">{formatDate(company.created_at)}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
            <h3 className="mb-4 text-base font-medium text-white">Contacts</h3>
            {companyUsers.length ? (
              <ul className="space-y-3">
                {companyUsers.map((entry) => (
                  <li key={entry.user_id} className="text-sm text-[#E2E8F0]">
                    {entry.full_name ?? entry.email ?? "User"}
                    {entry.is_primary ? (
                      <span className="ml-2 inline-flex">
                        <StatusBadge label="PRIMARY" tone="info" />
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No contacts" description="No company users linked yet." />
            )}
          </div>
        </div>
      ) : null}

      {tab === "projects" && tabData ? (
        <TabList
          items={tabData.projects}
          emptyTitle="No projects"
          rowKey={(p) => p.id}
          render={(p) => (
            <AdminListCard
              title={p.name}
              subtitle={`Progress ${p.progress}%`}
              href={`/admin/projects/${p.id}`}
              meta={<StatusBadge label={formatStatusLabel(p.status_label)} />}
            />
          )}
        />
      ) : null}

      {tab === "services" && tabData ? (
        <TabList
          items={tabData.subscriptions}
          emptyTitle="No subscriptions"
          rowKey={(s) => s.id}
          render={(s) => (
            <AdminListCard
              title={s.service_name ?? "Service"}
              subtitle={`${formatCurrency(s.price, s.currency)} · ${s.billing_period}`}
              meta={<StatusBadge label={formatStatusLabel(s.status)} />}
            />
          )}
        />
      ) : null}

      {tab === "tasks" && tabData ? (
        <TabList
          items={tabData.tasks}
          emptyTitle="No tasks"
          rowKey={(t) => t.id}
          render={(t) => (
            <AdminListCard
              title={t.title}
              subtitle="Project task"
              meta={<StatusBadge label={formatStatusLabel(t.status)} />}
            />
          )}
        />
      ) : null}

      {tab === "tickets" && tabData ? (
        <TabList
          items={tabData.tickets}
          emptyTitle="No tickets"
          rowKey={(t) => t.id}
          render={(t) => (
            <AdminListCard
              title={t.subject}
              subtitle={formatDateTime(t.updated_at)}
              href={`/admin/tickets/${t.id}`}
              meta={<StatusBadge label={formatStatusLabel(t.status)} />}
            />
          )}
        />
      ) : null}

      {tab === "documents" && tabData ? (
        <TabList
          items={tabData.documents}
          emptyTitle="No documents"
          rowKey={(d) => d.id}
          render={(d) => (
            <AdminListCard
              title={d.title}
              subtitle={formatDate(d.created_at)}
              meta={<StatusBadge label={formatStatusLabel(d.visibility)} tone="info" />}
            />
          )}
        />
      ) : null}

      {tab === "reports" && tabData ? (
        <TabList
          items={tabData.reports}
          emptyTitle="No reports"
          rowKey={(r) => r.id}
          render={(r) => (
            <AdminListCard
              title={r.title}
              subtitle={r.report_type}
              meta={<StatusBadge label={formatStatusLabel(r.visibility)} tone="info" />}
            />
          )}
        />
      ) : null}

      {tab === "meetings" && tabData ? (
        <TabList
          items={tabData.meetings}
          emptyTitle="No meetings"
          rowKey={(m) => m.id}
          render={(m) => (
            <AdminListCard
              title={m.title}
              subtitle={formatDateTime(m.starts_at)}
              meta={<StatusBadge label={formatStatusLabel(m.status)} />}
            />
          )}
        />
      ) : null}

      {tab === "invoices" && tabData ? (
        <TabList
          items={tabData.invoices}
          emptyTitle="No invoices"
          rowKey={(i) => i.id}
          render={(i) => (
            <AdminListCard
              title={i.invoice_number}
              subtitle={formatCurrency(i.total, i.currency)}
              href={`/admin/invoices/${i.id}`}
              meta={<StatusBadge label={formatStatusLabel(i.status)} />}
            />
          )}
        />
      ) : null}

      {tab === "payments" && tabData ? (
        <TabList
          items={tabData.payments}
          emptyTitle="No payments"
          rowKey={(p) => p.id}
          render={(p) => (
            <AdminListCard
              title={formatCurrency(p.amount, p.currency)}
              subtitle={p.transaction_reference ?? formatDateTime(p.created_at)}
              meta={<StatusBadge label={formatStatusLabel(p.status)} />}
            />
          )}
        />
      ) : null}

      {tab === "analytics" && tabData ? (
        <TabList
          items={tabData.analyticsConn}
          emptyTitle="No analytics connections"
          rowKey={(c) => c.id}
          render={(c) => (
            <AdminListCard
              title={c.display_name ?? c.property_id ?? "Analytics"}
              subtitle={`Property ${c.property_id ?? "—"}`}
              meta={<StatusBadge label={formatStatusLabel(c.status)} />}
            />
          )}
        />
      ) : null}

      {tab === "seo" && tabData ? (
        <TabList
          items={tabData.seoConn}
          emptyTitle="No SEO connections"
          rowKey={(c) => c.id}
          render={(c) => (
            <AdminListCard
              title={c.display_name ?? c.site_url ?? "SEO"}
              subtitle={c.site_url ?? "—"}
              meta={<StatusBadge label={formatStatusLabel(c.status)} />}
            />
          )}
        />
      ) : null}

      {tab === "activity" && tabData ? (
        <div className="space-y-3">
          {[
            ...tabData.tickets.map((item) => ({
              key: `ticket-${item.id}`,
              title: item.subject,
              subtitle: formatDateTime(item.updated_at),
            })),
            ...tabData.payments.map((item) => ({
              key: `payment-${item.id}`,
              title: formatCurrency(item.amount, item.currency),
              subtitle: item.transaction_reference ?? formatDateTime(item.created_at),
            })),
          ]
            .slice(0, 10)
            .map((item) => (
              <AdminListCard key={item.key} title={item.title} subtitle={item.subtitle} />
            ))}
          {!tabData.tickets.length && !tabData.payments.length ? (
            <EmptyState title="No activity" description="No recent tickets or payments for this client." />
          ) : null}
        </div>
      ) : null}

      <div className="mt-6">
        <Link href="/admin/clients" className="text-sm text-[#93C5FD] hover:underline">
          ← Back to clients
        </Link>
      </div>
    </>
  );
}

function TabList<T>({
  items,
  emptyTitle,
  rowKey,
  render,
}: {
  items: T[];
  emptyTitle: string;
  rowKey: (item: T) => string;
  render: (item: T) => ReactNode;
}) {
  if (!items.length) {
    return <EmptyState title={emptyTitle} description="No records found for this client." />;
  }
  return <div className="space-y-3">{items.map((item) => <div key={rowKey(item)}>{render(item)}</div>)}</div>;
}
