import {
  countOpenSupportTickets,
  countPendingInvoices,
} from "@/lib/data/client-dashboard-activity";
import { getClientInvoices } from "@/lib/data/client-invoices";
import { getClientNotifications } from "@/lib/data/client-notifications";
import { getClientTickets } from "@/lib/data/client-support";
import type { ClientNavBadgeCounts } from "@/config/navigation/platform";
import type { AuthSession } from "@/lib/auth/session";

/** Lightweight counts for client sidebar badges (real data only). */
export async function getClientNavBadgeCounts(
  session: AuthSession,
): Promise<ClientNavBadgeCounts> {
  const companyIds = session.profile.company_ids;
  if (!companyIds.length) {
    return {};
  }

  const [ticketsResult, notificationsResult, invoicesResult] = await Promise.all([
    getClientTickets(companyIds),
    getClientNotifications(session.user.id),
    getClientInvoices(companyIds),
  ]);

  const badges: ClientNavBadgeCounts = {};

  if (!ticketsResult.skipped && !ticketsResult.error) {
    const open = countOpenSupportTickets(
      ticketsResult.data.map((t) => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        created_at: t.created_at,
        updated_at: t.updated_at,
      })),
    );
    if (open > 0) badges.support = open;
  }

  if (!notificationsResult.skipped && !notificationsResult.error) {
    const unread = notificationsResult.data.filter((n) => !n.read_at).length;
    if (unread > 0) badges.notifications = unread;
  }

  if (!invoicesResult.skipped && !invoicesResult.error) {
    const pending = countPendingInvoices(invoicesResult.data);
    if (pending > 0) badges.invoices = pending;
  }

  return badges;
}
