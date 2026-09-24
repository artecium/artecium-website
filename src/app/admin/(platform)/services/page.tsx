import { SubscriptionForm } from "@/components/admin/SubscriptionForm";
import { AdminTable } from "@/components/admin/AdminTable";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { requireAdminPage } from "@/lib/auth/admin-access";
import { canManageSubscriptions } from "@/lib/auth/resource-access";
import {
  getAdminCompaniesForSelect,
  getAdminServicesCatalog,
  getAdminSubscriptions,
} from "@/lib/data/admin/queries";
import {
  formatCurrency,
  formatDate,
  formatStatusLabel,
  listSectionMessage,
} from "@/lib/data/client-format";
import { PERMISSIONS } from "@/types/platform";

export default async function AdminServicesPage() {
  const session = await requireAdminPage(PERMISSIONS.CLIENTS_VIEW);
  const [result, companiesResult, catalog] = await Promise.all([
    getAdminSubscriptions(),
    getAdminCompaniesForSelect(),
    getAdminServicesCatalog(),
  ]);
  const section = listSectionMessage(result, "No subscriptions", "Client subscriptions will appear here.");
  const canManage = canManageSubscriptions(session);

  const services = catalog.services.map((s) => ({
    id: s.id as string,
    name: s.name as string,
  }));
  const plans = catalog.plans.map((p) => ({
    id: p.id as string,
    name: p.name as string,
    service_id: p.service_id as string,
    price: p.price !== null ? Number(p.price) : null,
  }));

  return (
    <>
      <PageHeader title="Serviços" description="Client subscriptions, plans, and billing periods." />

      {canManage ? (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-medium text-white">Create subscription</h2>
          <SubscriptionForm
            companies={companiesResult.data}
            services={services}
            plans={plans}
          />
        </div>
      ) : null}

      {section.hasData ? (
        <AdminTable
          rows={result.data}
          rowKey={(row) => row.id}
          columns={[
            { key: "client", header: "Cliente", render: (row) => row.company_name ?? "—" },
            { key: "service", header: "Serviço", render: (row) => row.service_name ?? "—" },
            { key: "plan", header: "Plano", render: (row) => row.plan_name ?? "—" },
            {
              key: "price",
              header: "Preço",
              render: (row) =>
                row.price !== null ? formatCurrency(row.price, row.currency) : "—",
            },
            { key: "period", header: "Periodicidade", render: (row) => row.billing_period },
            {
              key: "status",
              header: "Estado",
              render: (row) => <StatusBadge label={formatStatusLabel(row.status)} />,
            },
            { key: "start", header: "Início", render: (row) => formatDate(row.started_at) },
            { key: "end", header: "Fim", render: (row) => formatDate(row.current_period_end) },
          ]}
        />
      ) : (
        <EmptyState title={section.emptyTitle} description={section.emptyDescription} />
      )}
    </>
  );
}
