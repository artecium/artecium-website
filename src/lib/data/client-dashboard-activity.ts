import type { ClientInvoiceRow } from "@/lib/data/client-invoices";
import { getInvoiceAmountDue } from "@/lib/data/client-invoices";
import type { ClientDocumentRow } from "@/lib/data/client-documents";
import type { ClientNotificationRow } from "@/lib/data/client-notifications";
import type { ClientPaymentRow } from "@/lib/data/client-payments";
import type {
  DashboardMeeting,
  DashboardProject,
  DashboardTicket,
} from "@/lib/data/client-dashboard";

export type DashboardActivityKind =
  | "ticket"
  | "payment"
  | "notification"
  | "project"
  | "document"
  | "meeting";

export interface DashboardActivityItem {
  id: string;
  kind: DashboardActivityKind;
  title: string;
  occurredAt: string;
  meta?: string;
}

const CLOSED_TICKET_STATUSES = new Set(["resolved", "closed"]);

function pushUnique(
  list: DashboardActivityItem[],
  item: DashboardActivityItem,
  limit: number,
) {
  if (list.length >= limit) return;
  list.push(item);
}

/** Merge real client events into a single timeline (newest first). */
export function buildDashboardActivityFeed(input: {
  tickets: DashboardTicket[];
  payments: ClientPaymentRow[];
  notifications: ClientNotificationRow[];
  projects: DashboardProject[];
  documents: ClientDocumentRow[];
  meetings: DashboardMeeting[];
  limit?: number;
}): DashboardActivityItem[] {
  const limit = input.limit ?? 12;
  const items: DashboardActivityItem[] = [];

  for (const ticket of input.tickets) {
    pushUnique(
      items,
      {
        id: `ticket-${ticket.id}`,
        kind: "ticket",
        title: ticket.subject,
        occurredAt: ticket.updated_at,
        meta: ticket.status,
      },
      limit * 2,
    );
  }

  for (const payment of input.payments) {
    const at = payment.paid_at ?? payment.created_at;
    pushUnique(
      items,
      {
        id: `payment-${payment.id}`,
        kind: "payment",
        title:
          payment.invoice_number ??
          payment.transaction_reference ??
          payment.provider_payment_id ??
          payment.id,
        occurredAt: at,
        meta: payment.status,
      },
      limit * 2,
    );
  }

  for (const notification of input.notifications) {
    pushUnique(
      items,
      {
        id: `notification-${notification.id}`,
        kind: "notification",
        title: notification.title,
        occurredAt: notification.created_at,
      },
      limit * 2,
    );
  }

  for (const project of input.projects) {
    if (!project.updated_at) continue;
    pushUnique(
      items,
      {
        id: `project-${project.id}`,
        kind: "project",
        title: project.name,
        occurredAt: project.updated_at,
        meta:
          project.status_label ??
          (project.progress > 0 ? `${project.progress}%` : undefined),
      },
      limit * 2,
    );
  }

  for (const document of input.documents) {
    pushUnique(
      items,
      {
        id: `document-${document.id}`,
        kind: "document",
        title: document.title,
        occurredAt: document.created_at,
        meta: document.category,
      },
      limit * 2,
    );
  }

  for (const meeting of input.meetings) {
    pushUnique(
      items,
      {
        id: `meeting-${meeting.id}`,
        kind: "meeting",
        title: meeting.title,
        occurredAt: meeting.starts_at,
        meta: meeting.status,
      },
      limit * 2,
    );
  }

  return items
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    )
    .slice(0, limit);
}

export function countOpenSupportTickets(tickets: DashboardTicket[]): number {
  return tickets.filter((t) => !CLOSED_TICKET_STATUSES.has(t.status)).length;
}

export function countPendingInvoices(invoices: ClientInvoiceRow[]): number {
  return invoices.filter((invoice) => getInvoiceAmountDue(invoice) !== null).length;
}
