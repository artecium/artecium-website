import { MeetingForm } from "@/components/admin/MeetingForm";
import { AdminTable } from "@/components/admin/AdminTable";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { requireAdminPage } from "@/lib/auth/admin-access";
import {
  getAdminCompaniesForSelect,
  getAdminMeetingsGrouped,
} from "@/lib/data/admin/queries";
import { formatDateTime, formatStatusLabel } from "@/lib/data/client-format";
import { PERMISSIONS } from "@/types/platform";

export default async function AdminMeetingsPage() {
  await requireAdminPage(PERMISSIONS.CLIENTS_VIEW);
  const [result, companiesResult] = await Promise.all([
    getAdminMeetingsGrouped(),
    getAdminCompaniesForSelect(),
  ]);

  const hasMeetings = result.data.upcoming.length + result.data.past.length > 0;
  const meetingColumns = [
    { key: "title", header: "Reunião", render: (row: { title: string }) => row.title },
    { key: "client", header: "Cliente", render: (row: { company_name: string | null }) => row.company_name ?? "—" },
    { key: "project", header: "Projeto", render: (row: { project_name: string | null }) => row.project_name ?? "—" },
    {
      key: "status",
      header: "Estado",
      render: (row: { status: string }) => <StatusBadge label={formatStatusLabel(row.status)} />,
    },
    {
      key: "starts",
      header: "Data",
      render: (row: { starts_at: string }) => formatDateTime(row.starts_at),
    },
  ];

  return (
    <>
      <PageHeader title="Reuniões" description="Upcoming and completed meetings with clients." />

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-medium text-white">Schedule meeting</h2>
        <MeetingForm companies={companiesResult.data} />
      </div>

      {hasMeetings ? (
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-lg font-medium text-white">Próximas reuniões</h2>
            <AdminTable
              rows={result.data.upcoming}
              rowKey={(row) => row.id}
              emptyMessage="No upcoming meetings."
              columns={meetingColumns}
            />
          </section>
          <section>
            <h2 className="mb-4 text-lg font-medium text-white">Reuniões concluídas</h2>
            <AdminTable
              rows={result.data.past}
              rowKey={(row) => row.id}
              emptyMessage="No past meetings."
              columns={meetingColumns}
            />
          </section>
        </div>
      ) : (
        <EmptyState title="No meetings" description="Meetings will appear here once scheduled." />
      )}
    </>
  );
}
