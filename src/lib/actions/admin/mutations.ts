"use server";

import { requireAdminPage } from "@/lib/auth/admin-access";
import { PERMISSIONS } from "@/types/platform";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function replyToTicket(ticketId: string, body: string) {
  const session = await requireAdminPage(PERMISSIONS.SUPPORT_RESPOND);
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message cannot be empty.");

  const supabase = await createClient();
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("id")
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketError || !ticket) {
    throw new Error("Ticket not found or access denied.");
  }

  const { error } = await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    body: trimmed,
    author_id: session.user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/tickets");
}

export async function updateTicketStatus(ticketId: string, status: string) {
  await requireAdminPage(PERMISSIONS.SUPPORT_RESPOND);
  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tickets/${ticketId}`);
}

export async function updateTaskStatus(taskId: string, status: string) {
  const { updateTask } = await import("./tasks");
  await updateTask(taskId, { status });
}

export async function updateProjectProgress(projectId: string, progress: number) {
  await requireAdminPage(PERMISSIONS.PROJECTS_EDIT);
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ progress: Math.min(100, Math.max(0, progress)) })
    .eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/projects/${projectId}`);
}
