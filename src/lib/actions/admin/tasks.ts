"use server";

import { requireAdminPage } from "@/lib/auth/admin-access";
import {
  assertProjectAccess,
  assertTaskAccess,
} from "@/lib/auth/resource-access";
import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS, PROJECT_PRIORITIES, TASK_STATUSES } from "@/types/platform";
import { revalidatePath } from "next/cache";

function assertTaskStatus(status: string) {
  if (!(TASK_STATUSES as readonly string[]).includes(status)) {
    throw new Error("Invalid task status.");
  }
}

function assertPriority(priority: string) {
  if (!(PROJECT_PRIORITIES as readonly string[]).includes(priority)) {
    throw new Error("Invalid task priority.");
  }
}

export async function createTask(input: {
  projectId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string | null;
  dueDate?: string | null;
  milestoneId?: string | null;
}) {
  await requireAdminPage(PERMISSIONS.PROJECTS_EDIT);
  await assertProjectAccess(input.projectId);

  const title = input.title.trim();
  if (!title) throw new Error("Task title is required.");

  const status = input.status ?? "todo";
  const priority = input.priority ?? "normal";
  assertTaskStatus(status);
  assertPriority(priority);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: input.projectId,
      title,
      description: input.description?.trim() || null,
      status,
      priority,
      assignee_id: input.assigneeId || null,
      due_date: input.dueDate || null,
      milestone_id: input.milestoneId || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/tasks");
  revalidatePath(`/admin/projects/${input.projectId}`);
  return data.id as string;
}

export async function updateTask(
  taskId: string,
  input: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assigneeId?: string | null;
    dueDate?: string | null;
    milestoneId?: string | null;
  },
) {
  await requireAdminPage(PERMISSIONS.PROJECTS_EDIT);
  const { projectId } = await assertTaskAccess(taskId);

  if (input.status) assertTaskStatus(input.status);
  if (input.priority) assertPriority(input.priority);

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.description !== undefined) updates.description = input.description.trim() || null;
  if (input.status !== undefined) {
    updates.status = input.status;
    updates.completed_at =
      input.status === "done" ? new Date().toISOString() : null;
  }
  if (input.priority !== undefined) updates.priority = input.priority;
  if (input.assigneeId !== undefined) updates.assignee_id = input.assigneeId;
  if (input.dueDate !== undefined) updates.due_date = input.dueDate;
  if (input.milestoneId !== undefined) updates.milestone_id = input.milestoneId;

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update(updates).eq("id", taskId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/tasks");
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function deleteTask(taskId: string) {
  await requireAdminPage(PERMISSIONS.PROJECTS_EDIT);
  const { projectId } = await assertTaskAccess(taskId);

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/tasks");
  revalidatePath(`/admin/projects/${projectId}`);
}
