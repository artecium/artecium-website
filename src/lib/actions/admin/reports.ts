"use server";

import { requireAdminPage } from "@/lib/auth/admin-access";
import { assertCompanyAccess, assertProjectAccess } from "@/lib/auth/resource-access";
import { createClient } from "@/lib/supabase/server";
import { DOCUMENT_VISIBILITY, PERMISSIONS } from "@/types/platform";
import { revalidatePath } from "next/cache";

function assertVisibility(visibility: string) {
  if (!(DOCUMENT_VISIBILITY as readonly string[]).includes(visibility)) {
    throw new Error("Invalid visibility value.");
  }
}

async function assertReportAccess(reportId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("id, company_id")
    .eq("id", reportId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Report not found or access denied.");
  }

  return data.company_id as string;
}

export async function createReport(input: {
  companyId: string;
  projectId?: string | null;
  title: string;
  reportType: string;
  visibility?: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  filePath?: string | null;
}) {
  await requireAdminPage(PERMISSIONS.REPORTS_VIEW);
  await assertCompanyAccess(input.companyId);

  if (input.projectId) {
    const projectCompanyId = await assertProjectAccess(input.projectId);
    if (projectCompanyId !== input.companyId) {
      throw new Error("Project does not belong to this company.");
    }
  }

  const title = input.title.trim();
  const reportType = input.reportType.trim();
  if (!title) throw new Error("Report title is required.");
  if (!reportType) throw new Error("Report type is required.");

  const visibility = input.visibility ?? "client_visible";
  assertVisibility(visibility);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .insert({
      company_id: input.companyId,
      project_id: input.projectId || null,
      title,
      report_type: reportType,
      visibility,
      period_start: input.periodStart || null,
      period_end: input.periodEnd || null,
      file_path: input.filePath || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/reports");
  revalidatePath(`/admin/clients/${input.companyId}`);
  revalidatePath("/client/reports");
  return data.id as string;
}

export async function updateReport(
  reportId: string,
  input: {
    title?: string;
    reportType?: string;
    visibility?: string;
    periodStart?: string | null;
    periodEnd?: string | null;
    projectId?: string | null;
    filePath?: string | null;
  },
) {
  await requireAdminPage(PERMISSIONS.REPORTS_VIEW);
  const companyId = await assertReportAccess(reportId);

  if (input.visibility) assertVisibility(input.visibility);
  if (input.projectId) {
    const projectCompanyId = await assertProjectAccess(input.projectId);
    if (projectCompanyId !== companyId) {
      throw new Error("Project does not belong to this company.");
    }
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.reportType !== undefined) updates.report_type = input.reportType.trim();
  if (input.visibility !== undefined) updates.visibility = input.visibility;
  if (input.periodStart !== undefined) updates.period_start = input.periodStart;
  if (input.periodEnd !== undefined) updates.period_end = input.periodEnd;
  if (input.projectId !== undefined) updates.project_id = input.projectId;
  if (input.filePath !== undefined) updates.file_path = input.filePath;

  const supabase = await createClient();
  const { error } = await supabase.from("reports").update(updates).eq("id", reportId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/reports");
  revalidatePath(`/admin/clients/${companyId}`);
  revalidatePath("/client/reports");
}

export async function deleteReport(reportId: string) {
  await requireAdminPage(PERMISSIONS.REPORTS_VIEW);
  const companyId = await assertReportAccess(reportId);

  const supabase = await createClient();
  const { error } = await supabase.from("reports").delete().eq("id", reportId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/reports");
  revalidatePath(`/admin/clients/${companyId}`);
  revalidatePath("/client/reports");
}
