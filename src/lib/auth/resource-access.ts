import type { AuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export class AccessDeniedError extends Error {
  constructor(message = "Access denied.") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export async function assertCompanyAccess(companyId: string): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    throw new AccessDeniedError("Company not found or access denied.");
  }
}

export async function assertProjectAccess(projectId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, company_id")
    .eq("id", projectId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    throw new AccessDeniedError("Project not found or access denied.");
  }

  return data.company_id as string;
}

export async function assertTaskAccess(taskId: string): Promise<{
  projectId: string;
  companyId: string;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, project_id, projects!inner( company_id )")
    .eq("id", taskId)
    .maybeSingle();

  if (error || !data) {
    throw new AccessDeniedError("Task not found or access denied.");
  }

  const project = data.projects as { company_id: string } | { company_id: string }[] | null;
  const projectRow = Array.isArray(project) ? project[0] : project;
  if (!projectRow?.company_id) {
    throw new AccessDeniedError("Task project context unavailable.");
  }

  return {
    projectId: data.project_id as string,
    companyId: projectRow.company_id,
  };
}

export async function assertTicketAccess(ticketId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("id, company_id")
    .eq("id", ticketId)
    .maybeSingle();

  if (error || !data?.company_id) {
    throw new AccessDeniedError("Ticket not found or access denied.");
  }

  return data.company_id as string;
}

export async function assertDocumentAccess(documentId: string): Promise<{
  companyId: string | null;
  filePath: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, company_id, file_path")
    .eq("id", documentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    throw new AccessDeniedError("Document not found or access denied.");
  }

  return {
    companyId: (data.company_id as string | null) ?? null,
    filePath: (data.file_path as string | null) ?? null,
  };
}

export async function assertSubscriptionAccess(subscriptionId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_subscriptions")
    .select("id, company_id")
    .eq("id", subscriptionId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    throw new AccessDeniedError("Subscription not found or access denied.");
  }

  return data.company_id as string;
}

export function canManageSubscriptions(session: AuthSession): boolean {
  return session.profile.roles.some((role) =>
    ["owner", "admin", "finance", "project_manager"].includes(role),
  );
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
