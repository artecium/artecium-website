import { AdminListCard } from "@/components/admin/AdminListCard";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { requireAdminPage } from "@/lib/auth/admin-access";
import {
  getAdminDashboardStats,
  getAdminRecentActivity,
} from "@/lib/data/admin/queries";
import {
  formatCurrency,
  formatDateTime,
  listSectionMessage,
} from "@/lib/data/client-format";
import Link from "next/link";

interface AdminDashboardPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  await requireAdminPage();
  const { error } = await searchParams;
  const [statsResult, activityResult] = await Promise.all([
    getAdminDashboardStats(),
    getAdminRecentActivity(),
  ]);

  const stats = statsResult.data;
  const activityMessage = listSectionMessage(
    activityResult,
    "No recent activity",
    "Activity will appear here as clients, payments, tickets, and projects are updated.",
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Operational overview for clients, projects, finance, and team activity."
      />

      {error === "unauthorized" ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          You do not have permission to access that section.
        </div>
      ) : null}

      {statsResult.error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Unable to load dashboard stats.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Clientes" value={stats.clients} href="/admin/clients" />
        <AdminStatCard label="Projetos ativos" value={stats.activeProjects} href="/admin/projects" />
        <AdminStatCard label="Projetos concluídos" value={stats.completedProjects} href="/admin/projects" />
        <AdminStatCard label="Tarefas pendentes" value={stats.pendingTasks} href="/admin/tasks" />
        <AdminStatCard label="Tickets abertos" value={stats.openTickets} href="/admin/tickets" />
        <AdminStatCard label="Pagamentos recebidos" value={stats.succeededPayments} href="/admin/payments" />
        <AdminStatCard label="Faturas pendentes" value={stats.pendingInvoices} href="/admin/invoices" />
        <AdminStatCard label="Reuniões futuras" value={stats.upcomingMeetings} href="/admin/meetings" />
        <AdminStatCard label="Serviços ativos" value={stats.activeSubscriptions} href="/admin/services" />
        <AdminStatCard
          label="MRR"
          value={formatCurrency(stats.monthlyRecurringRevenue, "EUR")}
          hint="Monthly recurring from active subscriptions"
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-white">Atividade recente</h2>
        {activityMessage.hasData ? (
          <div className="space-y-3">
            {activityResult.data.map((item, index) => (
              <AdminListCard
                key={`${item.type}-${item.date}-${index}`}
                title={item.title}
                subtitle={`${item.type} · ${formatDateTime(item.date)}`}
                href={item.href}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={activityMessage.emptyTitle}
            description={activityMessage.emptyDescription}
          />
        )}
      </section>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/admin/clients" className="text-[#93C5FD] hover:underline">
          Ver clientes
        </Link>
        <Link href="/admin/tickets" className="text-[#93C5FD] hover:underline">
          Ver tickets
        </Link>
      </div>
    </>
  );
}
