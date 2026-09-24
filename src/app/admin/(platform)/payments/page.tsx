import { AdminTable } from "@/components/admin/AdminTable";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { requireAdminPage } from "@/lib/auth/admin-access";
import { getAdminPayments } from "@/lib/data/admin/queries";
import {
  formatCurrency,
  formatDateTime,
  formatStatusLabel,
  listSectionMessage,
} from "@/lib/data/client-format";
import { PERMISSIONS } from "@/types/platform";

function paymentTone(status: string): "default" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "succeeded":
      return "success";
    case "pending":
      return "info";
    case "failed":
      return "danger";
    case "refunded":
      return "warning";
    default:
      return "default";
  }
}

export default async function AdminPaymentsPage() {
  await requireAdminPage(PERMISSIONS.PAYMENTS_VIEW);
  const result = await getAdminPayments();
  const section = listSectionMessage(result, "No payments", "Payment records will appear here.");

  return (
    <>
      <PageHeader
        title="Pagamentos"
        description="Payment records across all clients. Stripe integration planned for Phase 2."
      />

      {section.hasData ? (
        <AdminTable
          rows={result.data}
          rowKey={(row) => row.id}
          columns={[
            { key: "client", header: "Cliente", render: (row) => row.company_name ?? "—" },
            { key: "invoice", header: "Fatura", render: (row) => row.invoice_number ?? "—" },
            {
              key: "amount",
              header: "Valor",
              render: (row) => formatCurrency(row.amount, row.currency),
            },
            {
              key: "status",
              header: "Estado",
              render: (row) => (
                <StatusBadge label={formatStatusLabel(row.status)} tone={paymentTone(row.status)} />
              ),
            },
            { key: "provider", header: "Provider", render: (row) => row.provider ?? "—" },
            { key: "reference", header: "Reference", render: (row) => row.reference ?? "—" },
            { key: "date", header: "Data", render: (row) => formatDateTime(row.created_at) },
          ]}
        />
      ) : (
        <EmptyState title={section.emptyTitle} description={section.emptyDescription} />
      )}
    </>
  );
}
