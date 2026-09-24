"use server";

import { requireAdminPage } from "@/lib/auth/admin-access";
import { assertProjectAccess } from "@/lib/auth/resource-access";
import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/types/platform";
import { revalidatePath } from "next/cache";

async function assertProfileExists(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("User not found.");
  }
}

export async function addProjectMember(input: {
  projectId: string;
  userId: string;
  role: string;
}) {
  await requireAdminPage(PERMISSIONS.PROJECTS_ASSIGN);
  await assertProjectAccess(input.projectId);
  await assertProfileExists(input.userId);

  const role = input.role.trim();
  if (!role) throw new Error("Member role is required.");

  const supabase = await createClient();
  const { error } = await supabase.from("project_members").upsert(
    {
      project_id: input.projectId,
      user_id: input.userId,
      role,
    },
    { onConflict: "project_id,user_id" },
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/projects/${input.projectId}`);
}

export async function updateProjectMemberRole(input: {
  projectId: string;
  userId: string;
  role: string;
}) {
  await requireAdminPage(PERMISSIONS.PROJECTS_ASSIGN);
  await assertProjectAccess(input.projectId);

  const role = input.role.trim();
  if (!role) throw new Error("Member role is required.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_members")
    .update({ role })
    .eq("project_id", input.projectId)
    .eq("user_id", input.userId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/projects/${input.projectId}`);
}

export async function removeProjectMember(projectId: string, userId: string) {
  await requireAdminPage(PERMISSIONS.PROJECTS_ASSIGN);
  await assertProjectAccess(projectId);

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/projects/${projectId}`);
}
