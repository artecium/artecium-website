import { AdminTable } from "@/components/admin/AdminTable";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { requireAdminPage } from "@/lib/auth/admin-access";
import { getAdminInvoices } from "@/lib/data/admin/queries";
import {
  formatCurrency,
  formatDate,
  formatStatusLabel,
  listSectionMessage,
} from "@/lib/data/client-format";
import { PERMISSIONS } from "@/types/platform";
import Link from "next/link";

export default async function AdminInvoicesPage() {
  await requireAdminPage(PERMISSIONS.INVOICES_VIEW);
  const result = await getAdminInvoices();
  const section = listSectionMessage(result, "No invoices", "Invoices will appear here once issued.");

  return (
    <>
      <PageHeader title="Faturas" description="Invoice management across all clients." />

      {section.hasData ? (
        <AdminTable
          rows={result.data}
          rowKey={(row) => row.id}
          columns={[
            {
              key: "number",
              header: "Número",
              render: (row) => (
                <Link href={`/admin/invoices/${row.id}`} className="text-[#93C5FD] hover:underline">
                  {row.invoice_number}
                </Link>
              ),
            },
            { key: "client", header: "Cliente", render: (row) => row.company_name ?? "—" },
            {
              key: "total",
              header: "Valor",
              render: (row) => formatCurrency(row.total, row.currency),
            },
            {
              key: "status",
              header: "Estado",
              render: (row) => <StatusBadge label={formatStatusLabel(row.status)} />,
            },
            { key: "issued", header: "Emissão", render: (row) => formatDate(row.issue_date) },
            { key: "due", header: "Vencimento", render: (row) => formatDate(row.due_date) },
          ]}
        />
      ) : (
        <EmptyState title={section.emptyTitle} description={section.emptyDescription} />
      )}
    </>
  );
}
