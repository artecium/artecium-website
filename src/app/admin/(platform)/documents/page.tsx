import { DocumentActions, DocumentUploadForm } from "@/components/admin/DocumentUploadForm";
import { AdminTable } from "@/components/admin/AdminTable";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { requireAdminPage } from "@/lib/auth/admin-access";
import {
  getAdminCompaniesForSelect,
  getAdminDocuments,
} from "@/lib/data/admin/queries";
import { formatDate, formatStatusLabel, listSectionMessage } from "@/lib/data/client-format";
import { PERMISSIONS } from "@/types/platform";

export default async function AdminDocumentsPage() {
  const session = await requireAdminPage(PERMISSIONS.DOCUMENTS_VIEW);
  const [result, companiesResult] = await Promise.all([
    getAdminDocuments(),
    getAdminCompaniesForSelect(),
  ]);
  const section = listSectionMessage(result, "No documents", "Documents will appear here once uploaded.");
  const canEdit = session.profile.permissions.includes(PERMISSIONS.DOCUMENTS_EDIT);

  return (
    <>
      <PageHeader
        title="Documentos"
        description="Internal and client-visible documents across all clients and projects."
      />

      {canEdit ? (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-medium text-white">Upload document</h2>
          <DocumentUploadForm companies={companiesResult.data} />
        </div>
      ) : null}

      {section.hasData ? (
        <AdminTable
          rows={result.data}
          rowKey={(row) => row.id}
          columns={[
            { key: "title", header: "Documento", render: (row) => row.title },
            { key: "category", header: "Categoria", render: (row) => row.category },
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
            ...(canEdit
              ? [
                  {
                    key: "actions",
                    header: "Actions",
                    render: (row: (typeof result.data)[number]) => (
                      <DocumentActions documentId={row.id} visibility={row.visibility} />
                    ),
                  },
                ]
              : []),
          ]}
        />
      ) : (
        <EmptyState title={section.emptyTitle} description={section.emptyDescription} />
      )}
    </>
  );
}
