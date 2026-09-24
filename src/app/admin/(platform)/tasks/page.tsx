import { GlobalTaskForm } from "@/components/admin/GlobalTaskForm";
import { AdminTable } from "@/components/admin/AdminTable";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { requireAdminPage } from "@/lib/auth/admin-access";
import {
  getAdminProjects,
  getAdminTasks,
  getStaffProfilesForAssignment,
} from "@/lib/data/admin/queries";
import { formatDate, formatStatusLabel, listSectionMessage } from "@/lib/data/client-format";
import { PERMISSIONS } from "@/types/platform";
import Link from "next/link";

export default async function AdminTasksPage() {
  const session = await requireAdminPage(PERMISSIONS.PROJECTS_VIEW);
  const [result, projectsResult] = await Promise.all([
    getAdminTasks(),
    getAdminProjects(),
  ]);
  const section = listSectionMessage(result, "No tasks", "Tasks will appear here once created on projects.");
  const canEdit = session.profile.permissions.includes(PERMISSIONS.PROJECTS_EDIT);
  const assignees = canEdit
    ? (await getStaffProfilesForAssignment()).map((p) => ({
        id: p.id as string,
        label: (p.full_name as string) ?? (p.email as string),
      }))
    : [];

  return (
    <>
      <PageHeader title="Tarefas" description="Cross-project task list for the delivery team." />

      {canEdit && projectsResult.data.length ? (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-medium text-white">Create task</h2>
          <GlobalTaskForm
            projects={projectsResult.data.map((p) => ({ id: p.id, name: p.name }))}
            assignees={assignees}
          />
        </div>
      ) : null}

      {section.hasData ? (
        <AdminTable
          rows={result.data}
          rowKey={(row) => row.id}
          columns={[
            { key: "title", header: "Tarefa", render: (row) => row.title },
            {
              key: "project",
              header: "Projeto",
              render: (row) => (
                <Link href={`/admin/projects/${row.project_id}?tab=tasks`} className="text-[#93C5FD] hover:underline">
                  {row.project_name ?? "—"}
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
            { key: "assignee", header: "Responsável", render: (row) => row.assignee_name ?? "—" },
            { key: "due", header: "Deadline", render: (row) => formatDate(row.due_date) },
          ]}
        />
      ) : (
        <EmptyState title={section.emptyTitle} description={section.emptyDescription} />
      )}
    </>
  );
}
