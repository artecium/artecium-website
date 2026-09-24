import { ReportForm } from "@/components/admin/ReportForm";
import { AdminTable } from "@/components/admin/AdminTable";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { requireAdminPage } from "@/lib/auth/admin-access";
import {
  getAdminCompaniesForSelect,
  getAdminReports,
} from "@/lib/data/admin/queries";
import { formatDate, formatStatusLabel, listSectionMessage } from "@/lib/data/client-format";
import { PERMISSIONS } from "@/types/platform";

export default async function AdminReportsPage() {
  await requireAdminPage(PERMISSIONS.REPORTS_VIEW);
  const [result, companiesResult] = await Promise.all([
    getAdminReports(),
    getAdminCompaniesForSelect(),
  ]);
  const section = listSectionMessage(result, "No reports", "Reports will appear here once created.");

  return (
    <>
      <PageHeader title="Relatórios" description="Client and internal reports across the platform." />

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-medium text-white">Create report</h2>
        <ReportForm companies={companiesResult.data} />
      </div>

      {section.hasData ? (
        <AdminTable
          rows={result.data}
          rowKey={(row) => row.id}
          columns={[
            { key: "title", header: "Relatório", render: (row) => row.title },
            { key: "type", header: "Tipo", render: (row) => row.report_type },
            { key: "client", header: "Cliente", render: (row) => row.company_name ?? "—" },
            { key: "project", header: "Projeto", render: (row) => row.project_name ?? "—" },
            {
              key: "visibility",
              header: "Visibilidade",
              render: (row) => (
                <StatusBadge
                  label={formatStatusLabel(row.visibility)}
                  tone={row.visibility === "client_visible" ? "success" : "info"}
                />
              ),
            },
            { key: "created", header: "Criado", render: (row) => formatDate(row.created_at) },
          ]}
        />
      ) : (
        <EmptyState title={section.emptyTitle} description={section.emptyDescription} />
      )}
    </>
  );
}
