import {
  type DataFetchResult,
  fromQueryResult,
  skippedFetchResult,
} from "@/lib/data/supabase-query";
import { createClient } from "@/lib/supabase/server";

export interface ClientMeetingRow {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  status: string;
  meeting_url: string | null;
  project_name: string | null;
}

export async function getClientMeetings(
  companyIds: string[],
): Promise<DataFetchResult<ClientMeetingRow[]>> {
  if (!companyIds.length) {
    return skippedFetchResult([], "getClientMeetings requires companyIds");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .select(
      `
      id,
      title,
      description,
      starts_at,
      ends_at,
      status,
      meeting_url,
      projects ( name )
    `,
    )
    .in("company_id", companyIds)
    .order("starts_at", { ascending: false });

  if (error) {
    return fromQueryResult("client-meetings.getClientMeetings", null, error, []);
  }

  const meetings = (data ?? []).map((row) => {
    const projects = row.projects as { name: string } | { name: string }[] | null;
    const project = Array.isArray(projects) ? projects[0] : projects;

    return {
      id: row.id as string,
      title: row.title as string,
      description: (row.description as string | null) ?? null,
      starts_at: row.starts_at as string,
      ends_at: (row.ends_at as string | null) ?? null,
      status: row.status as string,
      meeting_url: (row.meeting_url as string | null) ?? null,
      project_name: project?.name ?? null,
    };
  });

  return fromQueryResult("client-meetings.getClientMeetings", meetings, null, []);
}
