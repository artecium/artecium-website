import { AdminTable } from "@/components/admin/AdminTable";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { requireAdminPage } from "@/lib/auth/admin-access";
import { getAdminProjects } from "@/lib/data/admin/queries";
import { formatDate, listSectionMessage } from "@/lib/data/client-format";
import { PERMISSIONS } from "@/types/platform";
import Link from "next/link";

export default async function AdminProjectsPage() {
  await requireAdminPage(PERMISSIONS.PROJECTS_VIEW);
  const result = await getAdminProjects();
  const section = listSectionMessage(result, "No projects", "Projects will appear here once created.");

  return (
    <>
      <PageHeader title="Projetos" description="Delivery pipeline and project health across all clients." />

      {section.hasData ? (
        <AdminTable
          rows={result.data}
          rowKey={(row) => row.id}
          columns={[
            {
              key: "name",
              header: "Projeto",
              render: (row) => (
                <Link href={`/admin/projects/${row.id}`} className="text-[#93C5FD] hover:underline">
                  {row.name}
                </Link>
              ),
            },
            { key: "client", header: "Cliente", render: (row) => row.company_name ?? "—" },
            {
              key: "status",
              header: "Estado",
              render: (row) => <StatusBadge label={(row.status_label ?? "unknown").toUpperCase()} />,
            },
            { key: "progress", header: "Progresso", render: (row) => `${row.progress}%` },
            { key: "owner", header: "Responsável", render: (row) => row.owner_name ?? "—" },
            { key: "due", header: "Prazo", render: (row) => formatDate(row.due_date) },
            { key: "tasks", header: "Tarefas", render: (row) => row.task_count },
          ]}
        />
      ) : (
        <EmptyState title={section.emptyTitle} description={section.emptyDescription} />
      )}
    </>
  );
}
