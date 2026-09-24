import {
  type DataFetchResult,
  fromQueryResult,
  skippedFetchResult,
} from "@/lib/data/supabase-query";
import { createClient } from "@/lib/supabase/server";

export interface ClientTicketRow {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string | null;
  created_at: string;
  updated_at: string;
  project_name: string | null;
  messages: ClientTicketMessageRow[];
}

export interface ClientTicketMessageRow {
  id: string;
  body: string;
  created_at: string;
}

export async function getClientTickets(
  companyIds: string[],
): Promise<DataFetchResult<ClientTicketRow[]>> {
  if (!companyIds.length) {
    return skippedFetchResult([], "getClientTickets requires companyIds");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select(
      `
      id,
      subject,
      status,
      priority,
      category,
      created_at,
      updated_at,
      projects ( name )
    `,
    )
    .in("company_id", companyIds)
    .order("updated_at", { ascending: false });

  if (error) {
    return fromQueryResult("client-support.getClientTickets", null, error, []);
  }

  const ticketIds = (data ?? []).map((row) => row.id as string);
  const messagesByTicket = new Map<string, ClientTicketMessageRow[]>();

  if (ticketIds.length) {
    const { data: messages, error: messagesError } = await supabase
      .from("ticket_messages")
      .select("id, ticket_id, body, created_at")
      .in("ticket_id", ticketIds)
      .order("created_at", { ascending: true });

    if (messagesError) {
      return fromQueryResult("client-support.getClientTickets.messages", null, messagesError, []);
    }

    for (const message of messages ?? []) {
      const ticketId = message.ticket_id as string;
      const list = messagesByTicket.get(ticketId) ?? [];
      list.push({
        id: message.id as string,
        body: message.body as string,
        created_at: message.created_at as string,
      });
      messagesByTicket.set(ticketId, list);
    }
  }

  const tickets = (data ?? []).map((row) => {
    const projects = row.projects as { name: string } | { name: string }[] | null;
    const project = Array.isArray(projects) ? projects[0] : projects;

    return {
      id: row.id as string,
      subject: row.subject as string,
      status: row.status as string,
      priority: row.priority as string,
      category: (row.category as string | null) ?? null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      project_name: project?.name ?? null,
      messages: messagesByTicket.get(row.id as string) ?? [],
    };
  });

  return fromQueryResult("client-support.getClientTickets", tickets, null, []);
}
