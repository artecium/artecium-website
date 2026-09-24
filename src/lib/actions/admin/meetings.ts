"use server";

import { requireAdminPage } from "@/lib/auth/admin-access";
import { assertCompanyAccess, assertProjectAccess } from "@/lib/auth/resource-access";
import { createClient } from "@/lib/supabase/server";
import { MEETING_STATUSES, PERMISSIONS } from "@/types/platform";
import { revalidatePath } from "next/cache";

function assertMeetingStatus(status: string) {
  if (!(MEETING_STATUSES as readonly string[]).includes(status)) {
    throw new Error("Invalid meeting status.");
  }
}

async function assertMeetingAccess(meetingId: string): Promise<{
  companyId: string | null;
  projectId: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .select("id, company_id, project_id")
    .eq("id", meetingId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Meeting not found or access denied.");
  }

  return {
    companyId: (data.company_id as string | null) ?? null,
    projectId: (data.project_id as string | null) ?? null,
  };
}

export async function createMeeting(input: {
  companyId: string;
  projectId?: string | null;
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string | null;
  meetingUrl?: string | null;
  status?: string;
}) {
  const authSession = await requireAdminPage(PERMISSIONS.CLIENTS_VIEW);
  await assertCompanyAccess(input.companyId);
  if (input.projectId) {
    const projectCompanyId = await assertProjectAccess(input.projectId);
    if (projectCompanyId !== input.companyId) {
      throw new Error("Project does not belong to this company.");
    }
  }

  const title = input.title.trim();
  if (!title) throw new Error("Meeting title is required.");
  if (!input.startsAt) throw new Error("Start date/time is required.");

  const status = input.status ?? "scheduled";
  assertMeetingStatus(status);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .insert({
      company_id: input.companyId,
      project_id: input.projectId || null,
      title,
      description: input.description?.trim() || null,
      starts_at: input.startsAt,
      ends_at: input.endsAt || null,
      meeting_url: input.meetingUrl?.trim() || null,
      status,
      created_by: authSession.user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/meetings");
  revalidatePath(`/admin/clients/${input.companyId}`);
  revalidatePath("/client/meetings");
  return data.id as string;
}

export async function updateMeeting(
  meetingId: string,
  input: {
    title?: string;
    description?: string;
    startsAt?: string;
    endsAt?: string | null;
    meetingUrl?: string | null;
    status?: string;
    projectId?: string | null;
  },
) {
  await requireAdminPage(PERMISSIONS.CLIENTS_VIEW);
  const { companyId } = await assertMeetingAccess(meetingId);

  if (input.status) assertMeetingStatus(input.status);
  if (input.projectId) {
    const projectCompanyId = await assertProjectAccess(input.projectId);
    if (companyId && projectCompanyId !== companyId) {
      throw new Error("Project does not belong to this company.");
    }
  }

  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.description !== undefined) updates.description = input.description.trim() || null;
  if (input.startsAt !== undefined) updates.starts_at = input.startsAt;
  if (input.endsAt !== undefined) updates.ends_at = input.endsAt;
  if (input.meetingUrl !== undefined) updates.meeting_url = input.meetingUrl?.trim() || null;
  if (input.status !== undefined) updates.status = input.status;
  if (input.projectId !== undefined) updates.project_id = input.projectId;

  const supabase = await createClient();
  const { error } = await supabase.from("meetings").update(updates).eq("id", meetingId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/meetings");
  if (companyId) revalidatePath(`/admin/clients/${companyId}`);
  revalidatePath("/client/meetings");
}

export async function cancelMeeting(meetingId: string) {
  await updateMeeting(meetingId, { status: "cancelled" });
}
