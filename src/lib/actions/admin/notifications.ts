"use server";

import { requireAdminPage } from "@/lib/auth/admin-access";
import { assertCompanyAccess } from "@/lib/auth/resource-access";
import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/types/platform";
import { revalidatePath } from "next/cache";

export async function createNotification(input: {
  userId: string;
  companyId: string;
  title: string;
  body?: string;
  type?: string;
  category?: string | null;
  projectId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}) {
  await requireAdminPage(PERMISSIONS.CLIENTS_VIEW);
  await assertCompanyAccess(input.companyId);

  const title = input.title.trim();
  if (!title) throw new Error("Notification title is required.");
  if (!input.userId) throw new Error("Recipient is required.");

  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("company_users")
    .select("user_id")
    .eq("company_id", input.companyId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!membership) {
    throw new Error("Recipient is not linked to this company.");
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: input.userId,
      company_id: input.companyId,
      title,
      body: input.body?.trim() || null,
      type: input.type?.trim() || "general",
      category: input.category || null,
      project_id: input.projectId || null,
      entity_type: input.entityType || null,
      entity_id: input.entityId || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/notifications");
  revalidatePath(`/admin/clients/${input.companyId}`);
  revalidatePath("/client/notifications");
  return data.id as string;
}
