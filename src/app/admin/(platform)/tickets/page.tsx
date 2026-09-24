import { AdminTable } from "@/components/admin/AdminTable";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { requireAdminPage } from "@/lib/auth/admin-access";
import { getAdminTickets } from "@/lib/data/admin/queries";
import { formatDateTime, formatStatusLabel, listSectionMessage } from "@/lib/data/client-format";
import { PERMISSIONS } from "@/types/platform";
import Link from "next/link";

export default async function AdminTicketsPage() {
  await requireAdminPage(PERMISSIONS.SUPPORT_VIEW);
  const result = await getAdminTickets();
  const section = listSectionMessage(result, "No tickets", "Support tickets will appear here.");

  return (
    <>
      <PageHeader title="Tickets / Suporte" description="Support queue across all clients." />

      {section.hasData ? (
        <AdminTable
          rows={result.data}
          rowKey={(row) => row.id}
          columns={[
            {
              key: "subject",
              header: "Assunto",
              render: (row) => (
                <Link href={`/admin/tickets/${row.id}`} className="text-[#93C5FD] hover:underline">
                  {row.subject}
                </Link>
              ),
            },
            { key: "client", header: "Cliente", render: (row) => row.company_name ?? "—" },
            {
              key: "status",
              header: "Estado",
              render: (row) => <StatusBadge label={formatStatusLabel(row.status)} />,
            },
            {
              key: "priority",
              header: "Prioridade",
              render: (row) => <StatusBadge label={formatStatusLabel(row.priority)} tone="warning" />,
            },
            { key: "messages", header: "Mensagens", render: (row) => row.message_count },
            { key: "updated", header: "Atualizado", render: (row) => formatDateTime(row.updated_at) },
          ]}
        />
      ) : (
        <EmptyState title={section.emptyTitle} description={section.emptyDescription} />
      )}
    </>
  );
}
