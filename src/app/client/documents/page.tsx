import { ClientDocumentDownloadButton } from "@/components/client/ClientDocumentDownloadButton";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import {
  formatDate,
  listSectionMessage,
} from "@/lib/data/client-format";
import { getClientDocuments } from "@/lib/data/client-documents";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { requireClientAuth } from "@/lib/auth/session";

export default async function ClientDocumentsPage() {
  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;
  const dbState = await getDatabaseReadyState();
  const documentsResult = await getClientDocuments(companyIds);
  const section = listSectionMessage(
    documentsResult,
    "No documents yet",
    "Contracts, proposals, reports, and project files will appear here.",
  );

  return (
    <>
      <PageHeader
        title="Documents"
        description="Contracts, proposals, reports, and project files."
      />

      {!dbState.configured ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {dbState.message}
        </div>
      ) : null}

      {section.hasData ? (
        <ul className="space-y-3">
          {documentsResult.data.map((document) => (
            <li
              key={document.id}
              className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-4 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-medium text-white">{document.title}</h2>
                  <p className="mt-1 text-xs text-[#64748B]">
                    {document.category}
                    {document.document_type ? ` · ${document.document_type}` : ""}
                  </p>
                </div>
                <StatusBadge label="Client visible" tone="info" />
              </div>
              <p className="mt-3 text-sm text-[#94A3B8]">
                {document.project_name ? `Project: ${document.project_name} · ` : ""}
                Added {formatDate(document.created_at)}
              </p>
              <ClientDocumentDownloadButton
                documentId={document.id}
                hasFile={Boolean(document.file_path)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={section.emptyTitle} description={section.emptyDescription} />
      )}
    </>
  );
}
