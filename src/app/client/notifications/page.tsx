import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import {
  formatDateTime,
  listSectionMessage,
} from "@/lib/data/client-format";
import { getClientNotifications } from "@/lib/data/client-notifications";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { requireClientAuth } from "@/lib/auth/session";

export default async function ClientNotificationsPage() {
  const session = await requireClientAuth();
  const dbState = await getDatabaseReadyState();
  const notificationsResult = await getClientNotifications(session.user.id);
  const section = listSectionMessage(
    notificationsResult,
    "No notifications yet",
    "Updates about projects, payments, approvals, and more will appear here.",
  );

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Updates about projects, payments, approvals, and more."
      />

      {!dbState.configured ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {dbState.message}
        </div>
      ) : null}

      {section.hasData ? (
        <ul className="space-y-3">
          {notificationsResult.data.map((notification) => (
            <li
              key={notification.id}
              className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-medium text-white">{notification.title}</h2>
                  {notification.body ? (
                    <p className="mt-2 text-sm text-[#94A3B8]">{notification.body}</p>
                  ) : null}
                </div>
                <StatusBadge
                  label={notification.read_at ? "Read" : "Unread"}
                  tone={notification.read_at ? "default" : "info"}
                />
              </div>
              <p className="mt-3 text-xs text-[#64748B]">
                {formatDateTime(notification.created_at)}
                {notification.category ? ` · ${notification.category}` : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={section.emptyTitle} description={section.emptyDescription} />
      )}
    </>
  );
}
