import {
  type DataFetchResult,
  fromQueryResult,
  skippedFetchResult,
} from "@/lib/data/supabase-query";
import { createClient } from "@/lib/supabase/server";

export interface ClientReportRow {
  id: string;
  title: string;
  report_type: string;
  period_start: string | null;
  period_end: string | null;
  file_path: string | null;
  visibility: string;
  created_at: string;
  project_name: string | null;
}

export async function getClientReports(
  companyIds: string[],
): Promise<DataFetchResult<ClientReportRow[]>> {
  if (!companyIds.length) {
    return skippedFetchResult([], "getClientReports requires companyIds");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      title,
      report_type,
      period_start,
      period_end,
      file_path,
      visibility,
      created_at,
      projects ( name )
    `,
    )
    .in("company_id", companyIds)
    .eq("visibility", "client_visible")
    .order("created_at", { ascending: false });

  if (error) {
    return fromQueryResult("client-reports.getClientReports", null, error, []);
  }

  const reports = (data ?? []).map((row) => {
    const projects = row.projects as { name: string } | { name: string }[] | null;
    const project = Array.isArray(projects) ? projects[0] : projects;

    return {
      id: row.id as string,
      title: row.title as string,
      report_type: row.report_type as string,
      period_start: (row.period_start as string | null) ?? null,
      period_end: (row.period_end as string | null) ?? null,
      file_path: (row.file_path as string | null) ?? null,
      visibility: row.visibility as string,
      created_at: row.created_at as string,
      project_name: project?.name ?? null,
    };
  });

  return fromQueryResult("client-reports.getClientReports", reports, null, []);
}
