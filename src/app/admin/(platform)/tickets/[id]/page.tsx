import { AdminListCard } from "@/components/admin/AdminListCard";
import { TicketReplyForm } from "@/components/admin/TicketReplyForm";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { requireAdminPage } from "@/lib/auth/admin-access";
import { getAdminTicketDetail } from "@/lib/data/admin/queries";
import { formatDateTime, formatStatusLabel } from "@/lib/data/client-format";
import { PERMISSIONS } from "@/types/platform";
import Link from "next/link";
import { notFound } from "next/navigation";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminTicketDetailPage({ params }: TicketDetailPageProps) {
  const session = await requireAdminPage(PERMISSIONS.SUPPORT_VIEW);
  const { id } = await params;
  const detail = await getAdminTicketDetail(id);

  if (!detail.ticket) notFound();

  const ticket = detail.ticket as Record<string, unknown>;
  const company = ticket.companies as { name?: string } | { name?: string }[] | null;
  const companyName = Array.isArray(company) ? company[0]?.name : company?.name;
  const canRespond = session.profile.permissions.includes(PERMISSIONS.SUPPORT_RESPOND);

  return (
    <>
      <PageHeader
        title={ticket.subject as string}
        description={companyName ? `Client: ${companyName}` : "Support ticket"}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <StatusBadge label={formatStatusLabel(ticket.status as string)} />
        <StatusBadge label={formatStatusLabel(ticket.priority as string)} tone="warning" />
      </div>

      <section className="mb-8 space-y-3">
        <h2 className="text-lg font-medium text-white">Conversation</h2>
        {(detail.messages as Record<string, unknown>[]).length ? (
          (detail.messages as Record<string, unknown>[]).map((message) => (
            <AdminListCard
              key={message.id as string}
              title={formatDateTime(message.created_at as string)}
              subtitle={message.body as string}
            />
          ))
        ) : (
          <EmptyState title="No messages" description="This ticket has no messages yet." />
        )}
      </section>

      {canRespond ? (
        <TicketReplyForm ticketId={id} currentStatus={ticket.status as string} />
      ) : null}

      <div className="mt-6">
        <Link href="/admin/tickets" className="text-sm text-[#93C5FD] hover:underline">
          ← Back to tickets
        </Link>
      </div>
    </>
  );
}
