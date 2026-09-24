"use server";

import { requireAdminPage } from "@/lib/auth/admin-access";
import { assertProjectAccess } from "@/lib/auth/resource-access";
import { createClient } from "@/lib/supabase/server";
import { MILESTONE_STATUSES, PERMISSIONS } from "@/types/platform";
import { revalidatePath } from "next/cache";

function assertMilestoneStatus(status: string) {
  if (!(MILESTONE_STATUSES as readonly string[]).includes(status)) {
    throw new Error("Invalid milestone status.");
  }
}

async function assertMilestoneAccess(milestoneId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_milestones")
    .select("id, project_id")
    .eq("id", milestoneId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Milestone not found or access denied.");
  }

  await assertProjectAccess(data.project_id as string);
  return data.project_id as string;
}

export async function createMilestone(input: {
  projectId: string;
  title: string;
  description?: string;
  status?: string;
  dueDate?: string | null;
  sortOrder?: number;
  responsibleUserId?: string | null;
}) {
  await requireAdminPage(PERMISSIONS.PROJECTS_EDIT);
  await assertProjectAccess(input.projectId);

  const title = input.title.trim();
  if (!title) throw new Error("Milestone title is required.");

  const status = input.status ?? "pending";
  assertMilestoneStatus(status);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_milestones")
    .insert({
      project_id: input.projectId,
      title,
      description: input.description?.trim() || null,
      status,
      due_date: input.dueDate || null,
      sort_order: input.sortOrder ?? 0,
      responsible_user_id: input.responsibleUserId || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/projects/${input.projectId}`);
  return data.id as string;
}

export async function updateMilestone(
  milestoneId: string,
  input: {
    title?: string;
    description?: string;
    status?: string;
    dueDate?: string | null;
    sortOrder?: number;
    responsibleUserId?: string | null;
  },
) {
  await requireAdminPage(PERMISSIONS.PROJECTS_EDIT);
  const projectId = await assertMilestoneAccess(milestoneId);

  if (input.status) assertMilestoneStatus(input.status);

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.description !== undefined) updates.description = input.description.trim() || null;
  if (input.status !== undefined) {
    updates.status = input.status;
    updates.completed_at =
      input.status === "completed" ? new Date().toISOString() : null;
  }
  if (input.dueDate !== undefined) updates.due_date = input.dueDate;
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;
  if (input.responsibleUserId !== undefined) {
    updates.responsible_user_id = input.responsibleUserId;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_milestones")
    .update(updates)
    .eq("id", milestoneId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function deleteMilestone(milestoneId: string) {
  await requireAdminPage(PERMISSIONS.PROJECTS_EDIT);
  const projectId = await assertMilestoneAccess(milestoneId);

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_milestones")
    .delete()
    .eq("id", milestoneId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/projects/${projectId}`);
}
