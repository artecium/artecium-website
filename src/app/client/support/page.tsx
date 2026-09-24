import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import {
  formatDateTime,
  formatStatusLabel,
  listSectionMessage,
} from "@/lib/data/client-format";
import { getClientTickets } from "@/lib/data/client-support";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { requireClientAuth } from "@/lib/auth/session";

function ticketStatusTone(
  status: string,
): "default" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "resolved":
    case "closed":
      return "success";
    case "in_progress":
    case "in_review":
      return "info";
    case "waiting_client":
      return "warning";
    default:
      return "default";
  }
}

export default async function ClientSupportPage() {
  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;
  const dbState = await getDatabaseReadyState();
  const ticketsResult = await getClientTickets(companyIds);
  const section = listSectionMessage(
    ticketsResult,
    "No support tickets yet",
    "Your support requests will appear here once you create a ticket.",
  );

  return (
    <>
      <PageHeader
        title="Support"
        description="Create and track support tickets."
      />

      {!dbState.configured ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {dbState.message}
        </div>
      ) : null}

      {section.hasData ? (
        <div className="space-y-4">
          {ticketsResult.data.map((ticket) => (
            <article
              key={ticket.id}
              className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-4 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-medium text-white">{ticket.subject}</h2>
                  {ticket.project_name ? (
                    <p className="mt-1 text-xs text-[#64748B]">Project: {ticket.project_name}</p>
                  ) : null}
                </div>
                <StatusBadge
                  label={formatStatusLabel(ticket.status)}
                  tone={ticketStatusTone(ticket.status)}
                />
              </div>
              <p className="mt-2 text-xs text-[#64748B]">
                Updated {formatDateTime(ticket.updated_at)}
              </p>

              {ticket.messages.length ? (
                <div className="mt-4 space-y-3 border-t border-[#1E293B] pt-4">
                  <h3 className="text-sm font-medium text-white">Messages</h3>
                  {ticket.messages.map((message) => (
                    <div
                      key={message.id}
                      className="rounded-xl border border-[#1E293B] bg-[#050816]/40 px-4 py-3"
                    >
                      <p className="text-sm text-[#94A3B8]">{message.body}</p>
                      <p className="mt-2 text-xs text-[#64748B]">
                        {formatDateTime(message.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title={section.emptyTitle} description={section.emptyDescription} />
      )}
    </>
  );
}
