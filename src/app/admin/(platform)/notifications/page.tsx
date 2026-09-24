import { NotificationForm } from "@/components/admin/NotificationForm";
import { AdminTable } from "@/components/admin/AdminTable";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { requireAdminPage } from "@/lib/auth/admin-access";
import { createClient } from "@/lib/supabase/server";
import {
  getAdminCompaniesForSelect,
  getAdminNotifications,
} from "@/lib/data/admin/queries";
import { formatDateTime, listSectionMessage } from "@/lib/data/client-format";
import { PERMISSIONS } from "@/types/platform";

async function getNotificationRecipients() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_users")
    .select("company_id, user_id, profiles ( email, full_name )");

  return (data ?? []).map((row) => {
    const profile = row.profiles as
      | { email?: string; full_name?: string }
      | { email?: string; full_name?: string }[]
      | null;
    const profileRow = Array.isArray(profile) ? profile[0] : profile;
    return {
      id: row.user_id as string,
      companyId: row.company_id as string,
      label: profileRow?.full_name ?? profileRow?.email ?? "User",
    };
  });
}

export default async function AdminNotificationsPage() {
  await requireAdminPage(PERMISSIONS.CLIENTS_VIEW);
  const [result, companiesResult, recipients] = await Promise.all([
    getAdminNotifications(),
    getAdminCompaniesForSelect(),
    getNotificationRecipients(),
  ]);
  const section = listSectionMessage(
    result,
    "No notifications",
    "Notifications will appear here once created for clients.",
  );

  return (
    <>
      <PageHeader
        title="Notificações"
        description="Platform notifications. Email delivery planned for Phase 2."
      />

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-medium text-white">Create notification</h2>
        <NotificationForm companies={companiesResult.data} recipients={recipients} />
      </div>

      {section.hasData ? (
        <AdminTable
          rows={result.data}
          rowKey={(row) => row.id}
          columns={[
            { key: "title", header: "Título", render: (row) => row.title },
            { key: "type", header: "Tipo", render: (row) => row.type },
            { key: "client", header: "Cliente", render: (row) => row.company_name ?? "—" },
            {
              key: "read",
              header: "Estado",
              render: (row) => (
                <StatusBadge
                  label={row.read_at ? "READ" : "UNREAD"}
                  tone={row.read_at ? "default" : "info"}
                />
              ),
            },
            { key: "created", header: "Criado", render: (row) => formatDateTime(row.created_at) },
          ]}
        />
      ) : (
        <EmptyState title={section.emptyTitle} description={section.emptyDescription} />
      )}
    </>
  );
}
